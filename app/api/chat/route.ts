import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RagPipeline } from "@/services/rag/ragPipeline";
import { connectDB } from "@/lib/mongodb";
import { Chat } from "@/models/Chat";
import { User } from "@/models/User";
import { Usage } from "@/models/Usage";
import { logger } from "@/utils/logger";
import { RateLimiter } from "@/utils/rateLimiter";

const ragPipeline = new RagPipeline();
const rateLimiter = new RateLimiter();

/**
 * GET /api/chat
 * Fetches the recent chat history for the user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      logger.warn("Unauthorized chat history access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const chat = await Chat.findOne({ userId: session.user.id }).sort({ createdAt: -1 });

    if (!chat) return NextResponse.json([]);

    // Filter messages older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentMessages = chat.messages.filter((msg: any) => 
      new Date(msg.timestamp) >= sevenDaysAgo
    );

    return NextResponse.json(recentMessages);
  } catch (error: any) {
    logger.error("Failed to fetch chat history", { error: error.message });
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // 2. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'chat_api', 30);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await connectDB();
    
    const user = await User.findById(userId);
    const strictMode = user?.settings?.strictMode ?? false;
    const similarityThreshold = user?.settings?.similarityThreshold ?? 0.1;
    const model = user?.settings?.defaultModel ?? 'meta-llama/llama-3.1-8b-instruct:free';

    logger.info("Chat API: Streaming start", { userId, model });

    const stream = await ragPipeline.runStreamingQuery(message, userId, strictMode, model, similarityThreshold);

    // 3. Clean up old history (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Operation 1: Remove stale messages
    await Chat.findOneAndUpdate(
      { userId },
      { $pull: { messages: { timestamp: { $lt: sevenDaysAgo } } } }
    );

    // Operation 2: Append the new user message
    await Chat.findOneAndUpdate(
      { userId },
      { $push: { messages: { role: 'user', content: message, timestamp: new Date() } } },
      { upsert: true }
    );

    const decoder = new TextDecoder();
    let assistantResponse = "";
    let usageData: any = null;
    let lineBuffer = "";

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // Decode the chunk and append to buffer
        lineBuffer += decoder.decode(chunk, { stream: true });
        
        // Split by newlines, keeping the last (potentially partial) line in the buffer
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || "";
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const json = JSON.parse(trimmed.slice(6));
              
              // Extract content
              const content = json.choices?.[0]?.delta?.content || "";
              assistantResponse += content;

              // Extract usage
              if (json.usage) {
                usageData = json.usage;
              }
            } catch (e) {
              // Ignore partial or malformed lines for content extraction
            }
          }
        }
        controller.enqueue(chunk);
      },
      async flush() {
        // Handle any remaining content in the buffer
        if (lineBuffer) {
          const trimmed = lineBuffer.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices?.[0]?.delta?.content || "";
              assistantResponse += content;
              if (json.usage) usageData = json.usage;
            } catch (e) {}
          }
        }

        if (assistantResponse) {
          try {
            await Chat.findOneAndUpdate(
              { userId },
              { $push: { messages: { role: 'assistant', content: assistantResponse, timestamp: new Date() } } }
            );
            
            // Safe Token Counting
            const totalTokens = usageData?.total_tokens ?? 
                             (usageData?.prompt_tokens ?? 0) + (usageData?.completion_tokens ?? 0);

            if (totalTokens > 0) {
              await Usage.create({
                userId,
                tokens: totalTokens,
                aiModel: model,
                type: 'chat'
              });
              logger.info("Stream usage tracked successfully", { userId, tokens: totalTokens });
            }
          } catch (dbErr: any) {
            logger.error("Chat Post-Processing Error", { error: dbErr.message, userId });
          }
        }
      }
    });

    const finalStream = stream.pipeThrough(transformStream);


    return new Response(finalStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (error: any) {
    logger.error('Chat API Fatal Error', { 
      message: error.message,
      stack: error.stack,
      userId: (await getServerSession(authOptions))?.user?.id 
    });
    
    // Attempt to provide a helpful error message to the frontend
    const friendlyMessage = error.message?.includes('LLM streaming failed') 
      ? `AI Provider Error: ${error.message.split(':').pop()}` 
      : error.message || "An unexpected error occurred.";

    return NextResponse.json(
      { 
        error: "Failed to process chat message", 
        message: friendlyMessage
      },
      { status: 500 }
    );
  }
}

