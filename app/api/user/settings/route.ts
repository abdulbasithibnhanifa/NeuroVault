import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { logger } from "@/utils/logger";
import { RateLimiter } from "@/utils/rateLimiter";

const rateLimiter = new RateLimiter();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'settings_get', 60);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for settings GET', { userId });
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }


    await connectDB();
    const { ModelService } = require("@/services/rag/modelService");
    const modelService = new ModelService();
    const availableModels = await modelService.getFreeModels();

    // Use upsert so credentials/dev users who don't have a DB record get defaults
    const user = await User.findOneAndUpdate(
      { _id: session.user.id },
      { 
        $setOnInsert: { 
          email: session.user.email || 'dev@neurovault.tech',
          name: session.user.name || 'Developer',
          settings: {
            strictMode: false,
            defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
            similarityThreshold: 0.1,
          }
        } 
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      ...(user.settings || {
        strictMode: false,
        defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
        similarityThreshold: 0.1,
      }),
      availableModels
    });
  } catch (error: any) {
    logger.error("GET User Settings Error", { error: error.message });
    // Return defaults instead of 500 so the UI always works
    return NextResponse.json({
      strictMode: false,
      defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
      similarityThreshold: 0.1,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'settings_post', 10);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for settings POST', { userId });
      return NextResponse.json({ error: "Too many settings updates" }, { status: 429 });
    }


    const settings = await req.json();

    await connectDB();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { settings },
      { new: true, upsert: true }
    );

    return NextResponse.json(user.settings);
  } catch (error: any) {
    logger.error("POST User Settings Error", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
