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

/**
 * GET /api/documents/[id]
 * Returns document metadata and full extracted text for preview.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'document_id_get', 60);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for document preview', { userId });
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }


    const { id } = params;
    logger.info(`Preview requested for document: ${id}`);
    
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    await connectDB();

    // 1. Fetch document metadata
    logger.info(`Fetching document ${id} from MongoDB...`);
    const document = await DocumentModel.findOne({ 
      _id: id, 
      userId: session.user.id 
    });

    if (!document) {
      logger.warn(`Document not found: ${id} for user: ${session.user.id}`);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    logger.info('Document metadata found', { title: document.title, status: document.status });

    // 2. Fetch all chunks from Vector Store
    logger.info(`Fetching chunks for document ${id} from Supabase...`);
    const vectorStore = new VectorStoreService();
    const s3Service = new S3Service();
    
    try {
      const chunks = await vectorStore.getChunksByDocumentId(id);
      const fullText = chunks.join('\n\n');

      // 3. Generate pre-signed URL if PDF
      let signedUrl = "";
      if (document.type === 'pdf' && document.s3Url) {
        signedUrl = await s3Service.getSignedUrl(document.s3Url, 300); // 5 mins
      }

      return NextResponse.json({
        document: {
          ...document.toObject(),
          s3Url: signedUrl || document.s3Url
        },
        fullText
      });
    } catch (vsError: any) {
      logger.error('Vector Store retrieval failed', { documentId: id, error: vsError.message });
      
      // Still generate signed URL even if chunks fail
      let signedUrl = "";
      if (document.type === 'pdf' && document.s3Url) {
        try {
          signedUrl = await s3Service.getSignedUrl(document.s3Url, 300);
        } catch (s3Err) {}
      }

      return NextResponse.json({
        document: {
          ...document.toObject(),
          s3Url: signedUrl || document.s3Url
        },
        fullText: '',
        warning: 'Could not retrieve document content from the vector store.'
      });
    }

  } catch (error: any) {
    logger.error('Document content retrieval failed', { 
      id: params.id, 
      message: error.message,
      userId: (await getServerSession(authOptions))?.user?.id
    });
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to retrieve document content'
      }, 
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'document_id_delete', 10);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for document deletion', { userId });
      return NextResponse.json({ error: 'Too many deletes. Please slow down.' }, { status: 429 });
    }


    const { id } = params;
    logger.info(`Deletion requested for document: ${id}`, { userId });

    await connectDB();

    const document = await DocumentModel.findOne({ 
      _id: id, 
      userId: session.user.id 
    });

    if (!document) {
      logger.warn(`Document not found or unauthorized deletion attempt: ${id}`);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // 2. Delete from S3 if applicable
    if (document.type === 'pdf' && document.s3Url) {
      try {
        const s3Service = new S3Service();
        const s3Key = S3Service.extractKey(document.s3Url);
        await s3Service.deleteFile(s3Key);
        logger.info('Deleted file from S3', { s3Key });
      } catch (s3Error: any) {
        logger.error('S3 deletion failed', { id, s3Url: document.s3Url, error: s3Error.message });
      }
    }


    // 3. Delete from Supabase (Vector Store)
    try {
      console.log('[DEBUG] Deleting from Vector Store...');
      const vectorStore = new VectorStoreService();
      await vectorStore.deleteByDocumentId(id);
      console.log('[DEBUG] Vector store deletion successful');
      logger.info('Deleted embeddings from Vector Store', { id });
    } catch (vsError: any) {
      console.log('[DEBUG] Vector store deletion failed:', vsError.message);
      logger.error('Failed to delete embeddings during document deletion', { 
        id, error: vsError.message 
      });
      // Continue cleanup
    }

    // 4. Delete from MongoDB
    console.log('[DEBUG] Deleting from MongoDB...');
    await DocumentModel.deleteOne({ _id: id });
    console.log('[DEBUG] MongoDB deletion successful');
    logger.info('Deleted document from MongoDB', { id });

    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });

  } catch (error: any) {
    logger.error('Document deletion failed', { 
      id: params.id, 
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

