import Redis from 'ioredis';
import { env } from '@neurovault/shared/config/env';
import { logger } from '@neurovault/shared/utils/logger';

let redisClient: Redis | null = null;

/**
 * Returns a singleton Redis client instance.
 * Used for BullMQ queues, caching, and rate limiting.
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    logger.info('Initializing Redis client...');
    const redisOptions = {
      maxRetriesPerRequest: null, // Required for BullMQ
      connectTimeout: 10000,
      disconnectTimeout: 2000,
      keepAlive: 10000,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    };

    if (env.REDIS_URL) {
      const isTLS = env.REDIS_URL.startsWith('rediss://');
      redisClient = new Redis(env.REDIS_URL, {
        ...redisOptions,
        ...(isTLS ? { tls: { rejectUnauthorized: false } } : {})
      });
    } else {
      redisClient = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        ...redisOptions
      });
    }

    // Add exactly one listener for the first connection
    redisClient.once('connect', () => {
      logger.info('Redis initial connection established');
    });

    redisClient.on('error', (err: any) => {
      // Don't spam the console if it's a common ECONNRESET/EPIPE (handled by retry)
      if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
        logger.debug('Redis intermittent connection error (retrying...)');
      } else {
        logger.error('Redis critical error:', err);
      }
    });
  }

  return redisClient;
}
