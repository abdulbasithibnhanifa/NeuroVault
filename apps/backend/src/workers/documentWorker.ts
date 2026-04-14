// workers/documentWorker.ts
// Document Worker - BullMQ worker for processing document jobs
// Runs as a separate service (Railway/Render/Fly.io)

import { Worker, Job } from 'bullmq';
import { 
  getRedisClient, 
  connectDB, 
  DocumentModel, 
  S3Service, 
  TextExtractor, 
  ChunkingService, 
  EmbeddingService, 
  VectorStoreService, 
  TaggingService, 
  YoutubeProcessor, 
  logger 
} from '@neurovault/shared';
import { DOCUMENT_QUEUE_NAME } from '../queues/documentQueue';

const s3Service = new S3Service();
const textExtractor = new TextExtractor();
const chunkingService = new ChunkingService();
const embeddingService = new EmbeddingService();
const vectorStoreService = new VectorStoreService();
const taggingService = new TaggingService();

/**
 * Sanitize text for AI analysis by removing excessive whitespace and non-printable characters.
 * Particularly important for messy PDF extractions.
 */
function cleanTextForAI(text: string): string {
  if (!text) return '';
  // 1. Normalize spaces/newlining
  let clean = text.replace(/\s+/g, ' ');
  // 2. Remove non-printable/control chars
  clean = clean.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  // 3. Trim to a meaningful snippet (approx 11500 chars for deep analysis)
  const snippet = clean.trim().substring(0, 11500);
  logger.info(`[Cleaner] Snippet prepared: ${snippet.length} characters.`);
  return snippet;
}

/**
 * BullMQ Worker for document processing
 * Handles: S3 download, text extraction, chunking, embeddings, and vector storage
 */
export const documentWorker = new Worker(
  DOCUMENT_QUEUE_NAME,
  async (job: Job) => {
    logger.info('Worker started');
    logger.info(`Listening to ${DOCUMENT_QUEUE_NAME} queue`);
    
    const { documentId, s3Url, youtubeUrl, type, userId } = job.data;
    
    try {
      logger.info(`Processing job ${job.id} for document ${documentId} (Type: ${type})`);
      
      await connectDB();
      
      // 1. Update status to processing
      await DocumentModel.findByIdAndUpdate(documentId, { status: 'processing' });

      let text = '';

      // 2. Extract text based on type
      if (type === 'pdf' && s3Url) {
        logger.info(`Downloading PDF from S3: ${s3Url}`);
        const s3Key = S3Service.extractKey(s3Url);
        const buffer = await s3Service.downloadFile(s3Key);
        text = await textExtractor.extract('pdf', buffer);
      } else if (type === 'youtube' && youtubeUrl) {
        // Fetch Title if it's the default
        try {
          const doc = await DocumentModel.findById(documentId);
          if (doc && (doc.title === 'YouTube Video' || !doc.title)) {
            logger.info(`START: Auto-fetching title for YouTube video: ${youtubeUrl}`);
            const ytProcessor = new YoutubeProcessor();
            const fetchedTitle = await ytProcessor.getVideoTitle(youtubeUrl);
            
            if (fetchedTitle) {
              await DocumentModel.findByIdAndUpdate(documentId, { title: fetchedTitle });
              logger.info(`FINISH: Updated YouTube title for ${documentId}: ${fetchedTitle}`);
            } else {
              logger.warn(`FINISH: No title found for YouTube video: ${youtubeUrl}`);
            }
          }
        } catch (titleErr) {
          logger.warn('ERROR: Failed to auto-update YouTube title', { error: titleErr });
        }

        logger.info(`START: Extracting transcript from YouTube: ${youtubeUrl}`);
        text = await textExtractor.extract('youtube', youtubeUrl);
        logger.info(`FINISH: Transcript extraction (${text.length} chars)`);
      } else if (type === 'note' && job.data.content) {
        text = await textExtractor.extract('note', job.data.content);
      } else {
        throw new Error(`Invalid job data for document ${documentId}`);
      }

      // 3.5 Auto-Analysis (Tags & Summary)
      logger.info(`START: Generating AI analysis for document ${documentId}`);
      // Fallback: If text is empty (e.g. transcript failed), use title for analysis
      const document = await DocumentModel.findById(documentId);
      const analysisInput = text || document.title;
      // CLEAN INPUT BEFORE AI
      const cleanedInput = cleanTextForAI(analysisInput);
      const analysis = await taggingService.generateAnalysis(cleanedInput, userId);
      logger.info(`FINISH: AI analysis completed (Tags: ${analysis.tags.length})`);

      // 3.7 EARLY SAVE: Persist tags/summary immediately so they appear in UI during heavy indexing
      if (analysis.tags.length > 0 || analysis.summary) {
        logger.info(`EARLY SAVE: Preparing to save analysis for ${documentId}`, { 
          tagCount: analysis.tags.length,
          hasSummary: !!analysis.summary 
        });

        const updateData: any = {
          suggestedTags: analysis.tags,
          description: analysis.summary
        };

        // If no tags currently exist, automatically add the AI tags
        if (!document.tags || document.tags.length === 0) {
          logger.info(`EARLY SAVE: Document ${documentId} has no tags. Auto-populating with: [${analysis.tags.join(', ')}]`);
          updateData.tags = analysis.tags;
        } else {
          logger.info(`EARLY SAVE: Document ${documentId} already has ${document.tags.length} tags. Skipping auto-populate.`);
        }

        await DocumentModel.findByIdAndUpdate(documentId, updateData);
        logger.info(`EARLY SAVE: Metadata and automatic tags persisted for document ${documentId}`);
      }

      // 4. Chunk text
      logger.info(`Chunking text for document ${documentId}`);
      const chunks = await chunkingService.chunkText(text || analysisInput.substring(0, 1000));

      // 5. Generate embeddings
      logger.info(`Generating embeddings for ${chunks.length} chunks`);
      const texts = chunks.map(c => c.text);
      const embeddings = await embeddingService.generateBatchEmbeddings(texts);

      // 6. Store in Vector Database
      logger.info(`Storing embeddings in Supabase for document ${documentId}`);
      await vectorStoreService.storeEmbeddings(
        documentId,
        userId,
        chunks,
        embeddings
      );

      // 7. Update document status to indexed
      const finalUpdate: any = { 
        status: text ? 'indexed' : 'analyzed',
        chunkCount: chunks.length
      };

      const currentDoc = await DocumentModel.findById(documentId);
      logger.info(`FINAL SAVE: Checking current state of ${documentId}`, {
        existingTags: currentDoc?.tags?.length || 0,
        existingDescription: !!currentDoc?.description
      });

      // Only include tags in final update if we actually got them
      if (analysis.tags && analysis.tags.length > 0) {
        finalUpdate.suggestedTags = analysis.tags;
        // Also ensure primary tags are set if they are still empty
        if (!currentDoc?.tags || currentDoc.tags.length === 0) {
          logger.info(`FINAL SAVE: Document ${documentId} still has no tags. Adding: [${analysis.tags.join(', ')}]`);
          finalUpdate.tags = analysis.tags;
        }
      }

      // Only update description if it's currently empty (don't overwrite user edits)
      if (!currentDoc?.description && analysis.summary) {
        finalUpdate.description = analysis.summary;
      }

      logger.info(`FINAL SAVE: Updating document ${documentId}`, { 
        status: finalUpdate.status,
        hasTags: !!finalUpdate.tags,
        hasDescription: !!finalUpdate.description 
      });

      await DocumentModel.findByIdAndUpdate(documentId, finalUpdate);
      logger.info(`FINAL SAVE: Document ${documentId} fully indexed and metadata finalized.`);

      logger.info(`Successfully indexed document ${documentId}`);
    } catch (error: any) {
      logger.error(`Error processing document ${documentId}:`, {
        message: error.message,
        stack: error.stack
      });
      
      await connectDB();
      const statusUpdate: any = { status: 'failed' };
      
      // Provide a more descriptive error in the document metadata if possible
      if (error.message === 'TRANSCRIPT_DISABLED') {
        statusUpdate.description = 'Ingestion failed: YouTube transcript is disabled for this video.';
      }

      await DocumentModel.findByIdAndUpdate(documentId, statusUpdate);
      
      throw error; // Let BullMQ handle the retry
    }
  },
  {
    connection: getRedisClient() as any,
    concurrency: 5,
  }
);

documentWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

documentWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err);
});
