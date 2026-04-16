import { Queue } from 'bullmq';
import { getRedisClient, isRedisIdleError, logger } from '@neurovault/shared';

export const DOCUMENT_QUEUE_NAME = 'document-processing';

/**
 * BullMQ Document Queue
 * Triggers background processing (PDF parsing, YouTube transcripts, Chunking)
 */
export const documentQueue = new Queue(DOCUMENT_QUEUE_NAME, {
  connection: getRedisClient('producer') as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
});

// Handle Queue-level errors to prevent raw stack trace leakage
documentQueue.on('error', (err) => {
  if (isRedisIdleError(err)) {
    logger.debug(`Queue [document-processing] connection reset (handled): ${err.message}`);
  } else {
    logger.error('Queue [document-processing] error:', err);
  }
});
