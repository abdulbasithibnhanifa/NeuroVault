import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { DocumentModel } from '@/models/Document';
import { logger } from '@/utils/logger';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter();

/**
 * POST /api/documents/update
 * Updates document metadata (title, tags, description).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'update_api', 20);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for document update', { userId });
      return NextResponse.json({ error: 'Too many updates. Please wait a minute.' }, { status: 429 });
    }


    const { documentId, title, tags, description } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    await connectDB();

    // 1. Find and verify ownership
    const document = await DocumentModel.findOne({ 
      _id: documentId, 
      userId: session.user.id 
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 403 });
    }

    // 2. Update fields
    if (title) document.title = title;
    if (tags) document.tags = tags;
    if (description !== undefined) document.description = description;

    await document.save();
    
    // 3. Re-fetch the full document to ensure we return all fields (like suggestedTags)
    // and virtuals to the frontend correctly.
    const updatedDoc = await DocumentModel.findById(documentId).lean();
    
    logger.info(`Document metadata updated: ${documentId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Metadata updated successfully',
      document: updatedDoc 
    });

  } catch (error: any) {
    logger.error('Metadata update failed', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
