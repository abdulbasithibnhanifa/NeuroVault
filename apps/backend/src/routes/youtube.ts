import { Router } from 'express';
import { 
  DocumentModel, 
  connectDB, 
  logger,
  RateLimiter
} from '@neurovault/shared';
import { documentQueue } from '../queues/documentQueue';

const router = Router();
const rateLimiter = new RateLimiter();

router.post('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const { url, title, tags, description } = req.body;

    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const isAllowed = await rateLimiter.checkLimit(user.id, 'youtube_api', 5);
    if (!isAllowed) return res.status(429).json({ error: 'Too many requests' });

    await connectDB();
    const document = await DocumentModel.create({
      userId: user.id,
      title: title || 'YouTube Video',
      type: 'youtube',
      status: 'uploaded',
      tags: tags || [],
      description: description || '',
    });

    await documentQueue.add('process-youtube', {
      documentId: document._id.toString(),
      youtubeUrl: url,
      type: 'youtube',
      userId: user.id,
    });

    logger.info(`YouTube ingestion started: ${document._id}`, { userId: user.id, url });
    return res.status(202).json({ message: 'Processing started', documentId: document._id });
  } catch (error) {
    logger.error('YouTube ingestion failed', error);
    return res.status(500).json({ error: 'YouTube ingestion failed' });
  }
});

export default router;
