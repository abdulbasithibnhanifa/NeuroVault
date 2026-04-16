import Redis, { RedisOptions } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * REDIS CONFIGURATION FOR PRODUCTION (Upstash/Cloud)
 */
const REDIS_OPTIONS: RedisOptions = {
  maxRetriesPerRequest: null, // Required for BullMQ compatibility
  enableReadyCheck: true,
  connectTimeout: 10000,
  // Upstash/Cloud environments often have aggressive idle timeouts (~30-60s).
  // Lowering keepAlive to 5s helps maintain the connection.
  keepAlive: 5000, 
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    // Be very persistent during the first 20 attempts to handle intermittent cloud blips
    if (times < 20) {
      return delay;
    }
    logger.error(`Redis: Max retries reached (${times}). Giving up.`);
    return null;
  },
  reconnectOnError(err) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'EPIPE'];
    if (targetErrors.some(te => err.message.includes(te))) {
      return true; // Force reconnect
    }
    return false;
  }
};

let redisClient: Redis | null = null;

/**
 * Returns a singleton Redis client instance.
 * Used for BullMQ queues, caching, and rate limiting.
 */
export const getRedisClient = (): Redis => {
  if (redisClient) return redisClient;

  const url = env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is not defined in environment variables');
  }

  // Use the validated URL from env
  const isTLS = url.startsWith('rediss://');
  redisClient = new Redis(url, {
    ...REDIS_OPTIONS,
    ...(isTLS ? { tls: { rejectUnauthorized: false } } : {})
  });

  // Suppress unhandled ECONNRESET/EPIPE logs from the driver itself
  redisClient.on('error', (err) => {
    if (['ECONNRESET', 'EPIPE'].some(code => err.message?.includes(code))) {
      logger.debug(`Redis intermittent connection error (handled): ${err.message}`);
    } else {
      logger.error('Redis connection error:', err);
    }
  });

  redisClient.once('ready', () => {
    logger.info('Redis connection established and ready');
  });

  return redisClient;
};
