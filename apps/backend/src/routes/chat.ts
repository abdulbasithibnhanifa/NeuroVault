import { Router } from 'express';
import { 
  RagPipeline, 
  Chat, 
  User, 
  Usage, 
  connectDB, 
  logger, 
  RateLimiter 
} from '@neurovault/shared';

const router = Router();
const ragPipeline = new RagPipeline();
const rateLimiter = new RateLimiter();

// GET /api/chat - History
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    await connectDB();
    const chat = await Chat.findOne({ userId: user.id }).sort({ createdAt: -1 });

    if (!chat) return res.json([]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentMessages = chat.messages.filter((msg: any) => 
      new Date(msg.timestamp) >= sevenDaysAgo
    );

    return res.json(recentMessages);
  } catch (error) {
    logger.error("Failed to fetch chat history", error);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
});

// POST /api/chat - Streaming
router.post('/', async (req, res) => {
  try {
    const userAuth = (req as any).user;
    const userId = userAuth.id;
    
    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'chat_api', 30);
    if (!isAllowed) {
      return res.status(429).json({ error: "Too many requests" });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    await connectDB();
    const user = await User.findById(userId);
    const strictMode = user?.settings?.strictMode ?? false;
    const similarityThreshold = user?.settings?.similarityThreshold ?? 0.1;
    const model = user?.settings?.defaultModel ?? 'meta-llama/llama-3.1-8b-instruct:free';

    logger.info("Chat API Backend: Streaming start", { userId, model });

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ragPipeline.runStreamingQuery(message, userId, strictMode, model, similarityThreshold);

    // Initial message saves
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await Chat.findOneAndUpdate(
      { userId },
      { $pull: { messages: { timestamp: { $lt: sevenDaysAgo } } } }
    );

    await Chat.findOneAndUpdate(
      { userId },
      { $push: { messages: { role: 'user', content: message, timestamp: new Date() } } },
      { upsert: true }
    );

    let assistantResponse = "";
    let usageData: any = null;

    // Use the native readable stream directly
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Pipe to response
      res.write(value);

      // Process for DB accumulation
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const json = JSON.parse(trimmed.slice(6));
            assistantResponse += json.choices?.[0]?.delta?.content || "";
            if (json.usage) usageData = json.usage;
          } catch (e) {}
        }
      }
    }

    // Save Assistant response and Usage
    if (assistantResponse) {
      await Chat.findOneAndUpdate(
        { userId },
        { $push: { messages: { role: 'assistant', content: assistantResponse, timestamp: new Date() } } }
      );
      
      const totalTokens = usageData?.total_tokens ?? 
                       (usageData?.prompt_tokens ?? 0) + (usageData?.completion_tokens ?? 0);

      if (totalTokens > 0) {
        await Usage.create({
          userId,
          tokens: totalTokens,
          aiModel: model,
          type: 'chat'
        });
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    logger.error('Chat API Fatal Error', error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process message" });
    } else {
      res.end();
    }
  }
});

export default router;
