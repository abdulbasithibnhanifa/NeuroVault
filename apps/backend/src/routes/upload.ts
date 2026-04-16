import { Router } from 'express';
import multer from 'multer';
import { 
  S3Service, 
  DocumentModel, 
  connectDB, 
  logger, 
  RateLimiter 
} from '@neurovault/shared';
// We need to import documentQueue, but it might still be in the old folder apps/backend/queues
import { documentQueue } from '../queues/documentQueue';

const router = Router();
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit to prevent Memory Denial of Service
  }
});
const rateLimiter = new RateLimiter();
const s3Service = new S3Service();

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;
    const file = req.file;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'upload_api', 5);
    if (!isAllowed) {
      return res.status(429).json({ error: 'Too many uploads. Please wait a minute.' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const title = req.body.title || file.originalname || 'Untitled Document';

    // 2. Upload to S3
    logger.info('Starting S3 upload from Backend...');
    const s3Key = `uploads/${userId}/${Date.now()}-${file.originalname}`;
    const storedKey = await s3Service.uploadFile(file.buffer, s3Key, file.mimetype);

    // 3. Create MongoDB Entry
    await connectDB();
    const document = await DocumentModel.create({
      userId,
      title,
      originalFilename: file.originalname,
      type: 'pdf',
      s3Url: storedKey,
      status: 'uploaded',
      chunkCount: 0,
    });

    // 4. Queue processing job
    await documentQueue.add('process-pdf', {
      documentId: document._id.toString(),
      s3Url: storedKey,
      userId,
      type: 'pdf',
    }, {
      jobId: document._id.toString(),
    });

    logger.info(`Document uploaded via Backend: ${document._id}`, { userId });

    return res.status(201).json({
      success: true,
      documentId: document._id,
    });

  } catch (error) {
    logger.error('Backend upload error:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }
});

export default router;
