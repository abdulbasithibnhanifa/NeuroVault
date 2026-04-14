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
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
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

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }

  return redisClient;
}
