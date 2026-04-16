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
  // family: 0 allows the driver to choose between IPv4 and IPv6,
  // which is critical for connectivity stability on Render/Upstash.
  family: 0,
  // Upstash/Cloud environments often have aggressive idle timeouts (~30-60s).
  // Lowering keepAlive to 2s proactively maintains the connection.
  keepAlive: 2000, 
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    // Security/Stability: ECONNRESET/EPIPE are common "idle closes" from cloud providers.
    // We allow up to 100 such events before giving up.
    if (times < 100) {
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
    // If it's a common connection reset, log as debug and let ioredis handle the retry
    if (['ECONNRESET', 'EPIPE'].some(code => err.message?.includes(code))) {
      logger.debug(`Redis connection reset (handled): ${err.message}`);
    } else {
      logger.error('Redis connection error:', err);
    }
  });

  redisClient.once('ready', () => {
    logger.info('Redis connection established and ready');
  });

  return redisClient;
};
