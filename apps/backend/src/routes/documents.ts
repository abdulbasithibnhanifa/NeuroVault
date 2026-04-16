import { Router } from 'express';
import { 
  DocumentModel, 
  User,
  TaggingService,
  S3Service,
  TextExtractor,
  connectDB, 
  logger,
  RateLimiter
} from '@neurovault/shared';
import { documentQueue } from '../queues/documentQueue';
import { validateObjectId } from '../middleware/validate';

const router = Router();
const rateLimiter = new RateLimiter();

// Get all documents for the authenticated user
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    await connectDB();
    const documents = await DocumentModel.find({ userId: user.id })
      .sort({ createdAt: -1 });
    
    return res.status(200).json(documents);
  } catch (error) {
    logger.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Create Note
router.post('/note', async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content, tags } = req.body;

    // Security Check: Rate Limit Note Creation
    const isAllowed = await rateLimiter.checkLimit(user.id, 'create_note', 10);
    if (!isAllowed) return res.status(429).json({ error: 'Too many notes. Please wait a minute.' });

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    await connectDB();
    const document = await DocumentModel.create({
      userId: user.id,
      title: title || 'New Note',
      type: 'note',
      content,
      tags: tags || [],
      status: 'uploaded',
    });

    await documentQueue.add('process-note', {
      documentId: document._id.toString(),
      content,
      userId: user.id,
      type: 'note',
    });

    logger.info(`Note created: ${document._id}`, { userId: user.id });
    return res.status(201).json({ success: true, documentId: document._id });
  } catch (error) {
    logger.error('Failed to create note', error);
    return res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update Metadata
router.post('/update', validateObjectId('body', 'documentId'), async (req, res) => {
  try {
    const user = (req as any).user;
    const { documentId, title, tags, description } = req.body;

    // Security Check: Rate Limit Updates
    const isAllowed = await rateLimiter.checkLimit(user.id, 'update_doc', 20);
    if (!isAllowed) return res.status(429).json({ error: 'Too many updates. Please wait.' });

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    await connectDB();
    // Security: Enforce userId to prevent IDOR
    const document = await DocumentModel.findOne({ _id: documentId, userId: user.id });

    if (!document) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (title) document.title = title;
    if (tags) document.tags = tags;
    if (description !== undefined) document.description = description;

    await document.save();
    logger.info(`Document metadata updated: ${documentId}`, { userId: user.id });
    return res.status(200).json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    logger.error('Update failed', error);
    return res.status(500).json({ error: 'Update failed' });
  }
});

// Share Document
router.post('/share', validateObjectId('body', 'documentId'), async (req, res) => {
  try {
    const user = (req as any).user;
    const { documentId, targetUserEmail } = req.body;

    // Security Check: Rate Limit Sharing
    const isAllowed = await rateLimiter.checkLimit(user.id, 'share_doc', 10);
    if (!isAllowed) return res.status(429).json({ error: 'Too many share requests.' });

    await connectDB();
    const targetUser = await User.findOne({ email: targetUserEmail?.toLowerCase() });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Security: Enforce userId
    const document = await DocumentModel.findOne({ _id: documentId, userId: user.id });
    if (!document) return res.status(403).json({ error: 'Access denied' });

    const targetUserId = targetUser._id.toString();
    if (targetUserId === user.id) return res.status(400).json({ error: 'Cannot share with yourself' });

    if (!document.sharedWith.includes(targetUserId)) {
      document.sharedWith.push(targetUserId);
      await document.save();
      logger.info(`Document shared: ${documentId}`, { from: user.id, to: targetUserId });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Share failed', error);
    return res.status(500).json({ error: 'Share failed' });
  }
});

// Regenerate AI Metadata
router.post('/regenerate', validateObjectId('body', 'documentId'), async (req, res) => {
  try {
    const user = (req as any).user;
    const { documentId } = req.body;

    // Security Check: Rate Limit AI Tasks (Expensive)
    const isAllowed = await rateLimiter.checkLimit(user.id, 'regenerate_ai', 5);
    if (!isAllowed) return res.status(429).json({ error: 'AI limit reached. Please wait.' });

    await connectDB();
    // Security: Enforce userId
    const document = await DocumentModel.findOne({ _id: documentId, userId: user.id });
    if (!document) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const taggingService = new TaggingService();
    let textToAnalyze = '';

    if (document.type === 'pdf' && document.s3Url) {
      const s3 = new S3Service();
      const buffer = await s3.downloadFile(S3Service.extractKey(document.s3Url));
      textToAnalyze = await (new TextExtractor()).extract('pdf', buffer);
    } else {
      textToAnalyze = (document as any).content || document.title;
    }

    const analysis = await taggingService.generateAnalysis(textToAnalyze, user.id);
    const updatedDoc = await DocumentModel.findByIdAndUpdate(documentId, {
      suggestedTags: analysis.tags,
      description: analysis.summary || document.description
    }, { new: true });

    logger.info(`AI Metadata regenerated for: ${documentId}`, { userId: user.id });
    return res.status(200).json({ success: true, suggestedTags: analysis.tags, description: updatedDoc?.description });
  } catch (error) {
    logger.error('Regeneration failed', error);
    return res.status(500).json({ error: 'Regeneration failed' });
  }
});

// Get single document
router.get('/:id', validateObjectId('params', 'id'), async (req, res) => {

  try {
    const user = (req as any).user;
    await connectDB();
    const document = await DocumentModel.findOne({ _id: req.params.id, userId: user.id });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    return res.status(200).json(document);
  } catch (error) {
    logger.error('Error fetching document:', error);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Delete document
router.delete('/:id', validateObjectId('params', 'id'), async (req, res) => {
  try {
    const user = (req as any).user;

    // Security Check: Rate Limit Deletions
    const isAllowed = await rateLimiter.checkLimit(user.id, 'delete_doc', 10);
    if (!isAllowed) return res.status(429).json({ error: 'Too many deletions.' });

    await connectDB();
    // Security: Enforce userId
    const result = await DocumentModel.deleteOne({ _id: req.params.id, userId: user.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    logger.warn(`Document deleted: ${req.params.id}`, { userId: user.id });
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
