import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { DocumentModel } from '@/models/Document';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter();

/**
 * POST /api/documents/share
 * Shares a document with another user by their email.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'share_api', 10);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for document sharing', { userId });
      return NextResponse.json({ error: 'Too many shares. Please wait a minute.' }, { status: 429 });
    }


    const { documentId, targetUserEmail } = await req.json();

    if (!documentId || !targetUserEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // 1. Find the target user
    const targetUser = await User.findOne({ email: targetUserEmail.toLowerCase() });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Find the document and verify ownership
    const document = await DocumentModel.findOne({ 
      _id: documentId, 
      userId: session.user.id 
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 403 });
    }

    // 3. Add to sharedWith if not already present
    const targetUserId = targetUser._id.toString();
    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
    }

    if (!document.sharedWith.includes(targetUserId)) {
      document.sharedWith.push(targetUserId);
      await document.save();
      logger.info(`Document ${documentId} shared with user ${targetUserId}`);
    }

    return NextResponse.json({ success: true, message: 'Document shared successfully' });

  } catch (error: any) {
    logger.error('Share operation failed', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
