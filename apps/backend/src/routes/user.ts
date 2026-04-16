import { Router } from 'express';
import { 
  User, 
  DocumentModel,
  ModelService,
  connectDB, 
  logger,
  RateLimiter
} from '@neurovault/shared';

const router = Router();
const rateLimiter = new RateLimiter();
const modelService = new ModelService();

// GET /api/user/settings
router.get('/settings', async (req, res) => {
  try {
    const userAuth = (req as any).user;
    await connectDB();
    
    const availableModels = await modelService.getFreeModels();

    const user = await User.findOneAndUpdate(
      { _id: userAuth.id },
      { 
        $setOnInsert: { 
          email: userAuth.email || 'dev@neurovault.tech',
          settings: {
            strictMode: false,
            defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
            similarityThreshold: 0.1,
          }
        } 
      },
      { upsert: true, new: true }
    );

    return res.json({
      ...(user.settings || {
        strictMode: false,
        defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
        similarityThreshold: 0.1,
      }),
      availableModels
    });
  } catch (error) {
    return res.json({
      strictMode: false,
      defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
      similarityThreshold: 0.1,
    });
  }
});

// POST /api/user/settings
router.post('/settings', async (req, res) => {
  try {
    const userAuth = (req as any).user;
    
    // Security Check: Rate Limit Settings Updates
    const isAllowed = await rateLimiter.checkLimit(userAuth.id, 'user_settings', 10);
    if (!isAllowed) return res.status(429).json({ error: 'Too many updates. Please wait.' });

    const { strictMode, defaultModel, similarityThreshold } = req.body;
    
    // Security: Whitelist allowed settings
    const cleanSettings: any = {};
    if (typeof strictMode === 'boolean') cleanSettings.strictMode = strictMode;
    if (typeof defaultModel === 'string') cleanSettings.defaultModel = defaultModel;
    if (typeof similarityThreshold === 'number') cleanSettings.similarityThreshold = similarityThreshold;

    if (Object.keys(cleanSettings).length === 0) {
      return res.status(400).json({ error: 'No valid settings provided' });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      userAuth.id,
      { $set: { settings: cleanSettings } },
      { new: true, upsert: true }
    );

    logger.info(`User settings updated: ${userAuth.id}`);
    return res.json(user.settings);
  } catch (error) {
    logger.error('Failed to update settings', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/user/storage
router.get('/storage', async (req, res) => {
  try {
    const userAuth = (req as any).user;
    const STORAGE_LIMIT_GB = 5.0;

    await connectDB();

    const result = await DocumentModel.aggregate([
      { $match: { userId: userAuth.id } },
      {
        $group: {
          _id: null,
          totalChunks: { $sum: '$chunkCount' },
          documentCount: { $sum: 1 },
          pdfCount: { $sum: { $cond: [{ $eq: ['$type', 'pdf'] }, 1, 0] } },
        }
      }
    ]);

    const stats = result[0] || { totalChunks: 0, documentCount: 0, pdfCount: 0 };
    const estimatedBytes = (stats.pdfCount * stats.totalChunks * 3000) + ((stats.documentCount - stats.pdfCount) * 30000);
    const usedMB = Math.max(estimatedBytes / (1024 * 1024), stats.documentCount > 0 ? stats.documentCount * 0.1 : 0);
    const usedGB = usedMB / 1024;
    const percentUsed = Math.min((usedGB / STORAGE_LIMIT_GB) * 100, 100);

    return res.json({
      usedBytes: estimatedBytes,
      usedMB: parseFloat(usedMB.toFixed(2)),
      usedGB: parseFloat(usedGB.toFixed(3)),
      limitGB: STORAGE_LIMIT_GB,
      percentUsed: parseFloat(percentUsed.toFixed(1)),
      documentCount: stats.documentCount,
      totalChunks: stats.totalChunks,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch storage stats' });
  }
});

export default router;
