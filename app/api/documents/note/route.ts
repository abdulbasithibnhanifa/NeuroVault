import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { DocumentModel } from '@/models/Document';
import { logger } from '@/utils/logger';
import { documentQueue } from '@/queues/documentQueue';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter();

/**
 * POST /api/documents/note - Create a new text note
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'note_api', 10);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for note creation', { userId });
      return NextResponse.json({ error: 'Too many notes. Please wait a minute.' }, { status: 429 });
    }


    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    await connectDB();

    const document = await DocumentModel.create({
      userId: session.user.id,
      title,
      content,
      type: 'note',
      status: 'uploaded', // Notes must be queued to get embedded in the vector store
      chunkCount: 0, 
    });

    await documentQueue.add('process-note', {
      documentId: document._id.toString(),
      type: 'note',
      content: content,
      userId: session.user.id,
    });

    logger.info(`Note created and queued: ${document._id}`);

    return NextResponse.json({
      success: true,
      documentId: document._id,
    }, { status: 201 });

  } catch (error: any) {
    logger.error('Note creation error:', { 
      message: error.message,
      userId: (await getServerSession(authOptions))?.user?.id 
    });
    return NextResponse.json(
      { 
        error: 'Failed to create note', 
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during note creation'
      }, 
      { status: 500 }
    );
  }
}

