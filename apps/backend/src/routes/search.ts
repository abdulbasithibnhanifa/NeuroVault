import { Router } from 'express';
import { 
  RetrievalService, 
  logger, 
  RateLimiter 
} from '@neurovault/shared';

const router = Router();
const rateLimiter = new RateLimiter();

router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    // 1. Rate Limiting Check
    const isAllowed = await rateLimiter.checkLimit(userId, 'search_api', 20);
    if (!isAllowed) {
      return res.status(429).json({ error: 'Too many search requests' });
    }

    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter "q"' });
    }

    const topK = parseInt((req.query.limit as string) || '10', 10);
    const filterType = req.query.type as any;
    const filterTags = (req.query.tags as string)?.split(',').filter(Boolean);

    const retrievalService = new RetrievalService();
    const results = await retrievalService.retrieve(userId, query, topK, 0.1, {
      type: filterType,
      tags: filterTags
    });

    const searchResults = results.map((r) => ({
      text: r.text,
      documentId: r.documentId,
      chunkIndex: r.chunkIndex,
      similarityScore: r.similarity,
    }));

    return res.status(200).json({ 
      results: searchResults, 
      query, 
      count: searchResults.length 
    });

  } catch (error) {
    logger.error('Search API error', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
