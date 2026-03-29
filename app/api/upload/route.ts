import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { S3Service } from '@/services/storage/s3Service';
import { documentQueue } from '@/queues/documentQueue';
import { DocumentModel } from '@/models/Document';
import { logger } from '@/utils/logger';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      logger.warn('Unauthorized upload attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;


    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'upload_api', 5);
    if (!isAllowed) {
      logger.warn('Rate limit exceeded for upload', { userId });
      return NextResponse.json({ error: 'Too many uploads. Please wait a minute.' }, { status: 429 });
    }


    // 2. Parse multipart form data
    logger.info('Parsing form data...');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || file?.name || 'Untitled Document';
    logger.info('File details', { name: file?.name, type: file?.type, size: file?.size });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // 3. Connect to DB
    logger.info('Connecting to MongoDB...');
    await connectDB();
    logger.info('MongoDB connected');

    // 4. Upload to S3
    logger.info('Starting S3 upload...');
    const s3Service = new S3Service();
    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `uploads/${userId}/${Date.now()}-${file.name}`;
    
    // uploadFile now returns the key, not a public URL
    const storedKey = await s3Service.uploadFile(buffer, s3Key, file.type);
    logger.info('S3 upload complete', { storedKey });

    // 5. Create Document entry in MongoDB
    logger.info('Creating document entry in MongoDB...');
    const document = await DocumentModel.create({
      userId,
      title,
      originalFilename: file.name,
      type: 'pdf',
      s3Url: storedKey, // We store the key in the s3Url field for backward compatibility
      status: 'uploaded',
      chunkCount: 0,
      suggestedTags: [],
    });
    logger.info('MongoDB document created', { id: document._id });

    // 6. Push job to BullMQ queue
    logger.info('Queueing BullMQ job...');
    await documentQueue.add('process-pdf', {
      documentId: document._id.toString(),
      s3Url: storedKey, // Passing the key
      userId,
      type: 'pdf',
    }, {
      jobId: document._id.toString(),
    });


    logger.info(`Document uploaded and queued: ${document._id}`);

    return NextResponse.json({
      success: true,
      documentId: document._id,
    }, { status: 201 });

  } catch (error) {
    logger.error('Document upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload document', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
