import { Router } from 'express';
import { 
  DocumentModel, 
  connectDB, 
  logger,
  RateLimiter
} from '@neurovault/shared';

const router = Router();
const rateLimiter = new RateLimiter();

router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const userId = user.id;

    const isAllowed = await rateLimiter.checkLimit(userId, 'graph_api', 60);
    if (!isAllowed) return res.status(429).json({ error: 'Too many requests' });

    await connectDB();
    const documents = await DocumentModel.find({
      $or: [{ userId }, { sharedWith: userId }]
    }).lean();

    const nodes: any[] = [];
    const links: any[] = [];
    const tagSet = new Set<string>();

    documents.forEach((doc: any) => {
      nodes.push({
        id: doc._id.toString(),
        label: doc.title,
        type: 'document',
        docType: doc.type,
        val: 20
      });

      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach((tag: string) => {
          const tagId = `tag-${tag}`;
          if (!tagSet.has(tag)) {
            tagSet.add(tag);
            nodes.push({ id: tagId, label: `#${tag}`, type: 'tag', val: 12 });
          }
          links.push({ source: doc._id.toString(), target: tagId });
        });
      }
    });

    return res.status(200).json({ nodes, links });
  } catch (error) {
    logger.error('Graph API Error', error);
    return res.status(500).json({ error: 'Graph failed' });
  }
});

export default router;
