import { Router } from 'express';
import { DocumentModel, connectDB, logger, RateLimiter } from '@neurovault/shared';

const router = Router();
const rateLimiter = new RateLimiter();

router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'stats_api', 60);
    if (!isAllowed) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    await connectDB();

    // 2. Fetch stats
    const totalDocs = await DocumentModel.countDocuments({ 
      $or: [{ userId }, { sharedWith: userId }] 
    });

    const pendingDocs = await DocumentModel.countDocuments({ 
      userId, 
      status: { $in: ['uploaded', 'processing'] } 
    });

    const processedDocs = await DocumentModel.countDocuments({ 
      userId, 
      status: 'indexed' 
    });

    const sharedWithMe = await DocumentModel.countDocuments({ 
      sharedWith: userId 
    });

    // 3. Get recent activity
    const recentDocs = await DocumentModel.find({ 
      $or: [{ userId }, { sharedWith: userId }] 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title status createdAt');

    return res.status(200).json({
      totalDocs,
      pendingDocs,
      processedDocs,
      sharedWithMe,
      recentActivity: recentDocs
    });

  } catch (error) {
    logger.error('Stats API Error', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
