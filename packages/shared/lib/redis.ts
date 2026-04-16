import Redis from 'ioredis';
import { env } from '@neurovault/shared/config/env';
import { logger } from '@neurovault/shared/utils/logger';

// Module-level singleton — shared across all requires of this module
let redisClient: Redis | null = null;

/**
 * Returns a singleton Redis client instance.
 * Used for BullMQ queues, caching, and rate limiting.
 * The module-level variable ensures only ONE client is ever created,
 * preventing the connection explosion during startup.
 */
export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const redisOptions = {
    maxRetriesPerRequest: null, // Required for BullMQ
    connectTimeout: 10000,
    keepAlive: 30000,
    lazyConnect: false,
    retryStrategy: (times: number) => {
      // Stop retrying after 10 failed attempts to avoid runaway reconnections
      if (times > 10) {
        logger.error('Redis: Max retries reached. Giving up.');
        return null;
      }
      return Math.min(times * 200, 5000);
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
      host: env.REDIS_HOST || 'localhost',
      port: env.REDIS_PORT || 6379,
      ...redisOptions
    });
  }

  // Only log the FIRST successful connection, never reconnections
  redisClient.once('ready', () => {
    logger.info('Redis connection ready');
  });

  // Silently suppress intermittent cloud connectivity errors (ECONNRESET/EPIPE)
  // These are handled automatically by the retryStrategy above
  redisClient.on('error', (err: any) => {
    if (err.code !== 'ECONNRESET' && err.code !== 'EPIPE') {
      logger.error(`Redis critical error [${err.code}]: ${err.message}`);
    }
  });

  return redisClient;
}
