import { Queue } from 'bullmq';
import { getRedisClient } from '@/lib/redis';

export const DOCUMENT_QUEUE_NAME = 'document-processing';

/**
 * BullMQ Document Queue
 * Triggers background processing (PDF parsing, YouTube transcripts, Chunking)
 */
export const documentQueue = new Queue(DOCUMENT_QUEUE_NAME, {
  connection: getRedisClient() as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
});
