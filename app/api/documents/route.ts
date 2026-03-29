// app/api/documents/route.ts
// GET /api/documents - Retrieve user's documents list
// DELETE /api/documents/:id - Delete a document
// Dependencies: MongoDB, S3, Supabase vector store

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { DocumentModel } from '@/models/Document';
import { S3Service } from '@/services/storage/s3Service';
import { VectorStoreService } from '@/services/embeddings/vectorStore';
import { logger } from '@/utils/logger';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter();

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1.5 Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'documents_get', 60);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for documents GET', { userId });
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const tags = searchParams.get('tags');
    const id = searchParams.get('id');

    // 2. Connect to Database
    if (!process.env.MONGODB_URI) {
      logger.warn('MONGODB_URI missing. Returning empty document list.');
      return NextResponse.json([]);
    }
    await connectDB();

    // 2.5 Handle single document fetch by ID (preview)
    if (id) {
      // For preview, only require authentication — no strict ownership check needed
      // This handles both owned and shared documents correctly
      const document = await DocumentModel.findById(id);

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      // Security: user must own or have the doc shared with them
      const canAccess = 
        String(document.userId) === String(userId) ||
        (document.sharedWith || []).some((uid: string) => String(uid) === String(userId));

      if (!canAccess) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // 2.6 Fetch full text for preview
      let fullText = document.content || '';
      
      if (document.status === 'indexed' || document.status === 'processed') {
        try {
          const vectorStore = new VectorStoreService();
          const chunks = await vectorStore.getChunksByDocumentId(id);
          if (chunks.length > 0) {
            fullText = chunks.join('\n\n');
          }
        } catch (vsError) {
          logger.error('Vector store fetch failed in preview', { id });
        }
      }

      // Friendly fallback for YouTube/notes without stored text
      if (!fullText) {
        if (document.type === 'youtube') {
          fullText = `YouTube video: ${document.title}\n\nThis document has been indexed for semantic search. The transcript has been processed and is available for AI queries.`;
        } else if (document.type === 'note') {
          fullText = document.content || 'Note content not available.';
        } else {
          fullText = 'Document content is indexed and available for AI queries.';
        }
      }

      // 2.7 If PDF, generate a pre-signed URL for the frontend
      const s3Service = new S3Service();
      let signedUrl = "";
      if (document.type === 'pdf' && document.s3Url) {
        try {
          signedUrl = await s3Service.getSignedUrl(document.s3Url, 300); // 5 minutes
        } catch (s3Err) {
          logger.error('Failed to generate signed URL', { id, error: s3Err });
        }
      }

      return NextResponse.json({ 
        document: {
          ...document.toObject(),
          s3Url: signedUrl || document.s3Url // Replace key with signed URL for client
        }, 
        fullText 
      });
    }

    // 3. Build query
    const query: any = {
      $or: [
        { userId },
        { sharedWith: userId }
      ]
    };
    
    const andFilters: any[] = [];

    if (search) {
      andFilters.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { originalFilename: { $regex: search, $options: 'i' } }
        ]
      });
      logger.info('Searching documents', { userId, query: search });
    }

    if (type) {
      andFilters.push({ type });
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      if (tagList.length > 0) {
        andFilters.push({ tags: { $all: tagList } });
      }
    }

    if (andFilters.length > 0) {
      query.$and = andFilters;
    }

    // 4. Fetch documents
    const documents = await DocumentModel.find(query).sort({ createdAt: -1 });

    return NextResponse.json(documents);
  } catch (error: any) {
    logger.error('Failed to fetch documents', { 
      message: error.message, 
      stack: error.stack,
      userId: (await getServerSession(authOptions))?.user?.id
    });
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to retrieve documents'
      }, 
      { status: 500 }
    );
  }
}


export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'documents_delete', 10);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for document deletion', { userId });
      return NextResponse.json({ error: 'Too many deletes. Please slow down.' }, { status: 429 });
    }


    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }
    
    await connectDB();

    const document = await DocumentModel.findById(id);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const isOwner = String(document.userId) === String(session.user.id);
    const isShared = (document.sharedWith || []).some((uid: string) => String(uid) === String(session.user.id));

    if (!isOwner && !isShared) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (isOwner) {
      // OWNER DELETE: full cleanup for all users

      // 1. Delete from S3 if applicable
      if (document.type === 'pdf' && document.s3Url) {
        try {
          const s3Service = new S3Service();
          const s3Key = S3Service.extractKey(document.s3Url);
          await s3Service.deleteFile(s3Key);
        } catch (s3Error: any) {
          logger.error('S3 delete failed', { id, error: s3Error.message });
        }
      }


      // 2. Delete from vector store
      try {
        const vectorStore = new VectorStoreService();
        await vectorStore.deleteByDocumentId(id);
      } catch (vsError: any) {
        console.error('Vector store delete failed', { id, error: vsError.message });
      }

      // 3. Delete from MongoDB entirely
      await DocumentModel.deleteOne({ _id: id });

      return NextResponse.json({ success: true, message: 'Document deleted for all users.' });
    } else {
      // SHARED USER DELETE: only remove themselves from the sharedWith array
      await DocumentModel.updateOne(
        { _id: id },
        { $pull: { sharedWith: session.user.id } }
      );

      return NextResponse.json({ success: true, message: 'Document removed from your vault.' });
    }

  } catch (error: any) {
    logger.error('Document deletion failed', { 
      message: error.message,
      userId: (await getServerSession(authOptions))?.user?.id 
    });
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to delete document'
      }, 
      { status: 500 }
    );
  }
}

