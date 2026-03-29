import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { documentQueue } from '@/queues/documentQueue';
import { DocumentModel } from '@/models/Document';
import { logger } from '@/utils/logger';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      logger.warn('Unauthorized YouTube ingestion attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'youtube_api', 5);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for YouTube ingestion', { userId });
      return NextResponse.json({ error: 'Too many YouTube requests. Please wait a minute.' }, { status: 429 });
    }

    const { url, title, tags, description } = await req.json();

    if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    await connectDB();

    // 1. Create document record
    const document = await DocumentModel.create({
      userId: session.user.id,
      title: title || 'YouTube Video',
      type: 'youtube',
      status: 'uploaded',
      tags: tags || [],
      description: description || '',
    });

    // 2. Queue processing job
    await documentQueue.add('process-youtube', {
      documentId: document._id.toString(),
      youtubeUrl: url,
      type: 'youtube',
      userId: session.user.id,
    });

    logger.info(`YouTube ingestion queued for document ${document._id}`);

    return NextResponse.json({
      message: 'Processing started',
      documentId: document._id
    }, { status: 202 });

  } catch (error: any) {
    logger.error('YouTube ingestion failed', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
