export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Document from '@/models/Document';
import { logger } from '@/utils/logger';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'stats_api', 60);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for stats', { userId });
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!process.env.MONGODB_URI) {
      logger.warn('MONGODB_URI missing. Returning placeholder stats.');
      return NextResponse.json({
        totalDocuments: 0,
        pendingTasks: 0,
        processedDocuments: 0,
        sharedDocuments: 0,
        recentActivity: [],
        systemHealth: {
          database: 'disconnected',
          vectorStore: 'disconnected',
          worker: 'active',
          llm: 'active'
        }
      });
    }

    await connectDB();

    // Fetch stats

    const totalDocs = await Document.countDocuments({ 
      $or: [{ userId }, { sharedWith: userId }] 
    });

    const pendingDocs = await Document.countDocuments({ 
      userId, 
      status: { $in: ['uploaded', 'processing'] } 
    });

    const processedDocs = await Document.countDocuments({ 
      userId, 
      status: 'indexed' 
    });

    const sharedWithMe = await Document.countDocuments({ 
      sharedWith: userId 
    });

    // Get recent activity (last 5 docs)
    const recentDocs = await Document.find({ 
      $or: [{ userId }, { sharedWith: userId }] 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title status createdAt');

    return NextResponse.json({
      totalDocs,
      pendingDocs,
      processedDocs,
      sharedWithMe,
      recentActivity: recentDocs
    });

  } catch (error: any) {
    logger.error('Stats API Error', { error: error.message });
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
