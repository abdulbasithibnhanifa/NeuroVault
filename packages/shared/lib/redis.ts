import Redis, { RedisOptions } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * REDIS CONFIGURATION FACTORY
 * Provides hardened options and isolated instances for different app roles.
 */
const getOptionsByRole = (role: 'default' | 'producer' | 'worker'): RedisOptions => {
  return {
    maxRetriesPerRequest: null, // Consistently null for monorepo safety with BullMQ
    enableReadyCheck: true,
    connectTimeout: 10000,
    family: 0, // Critical for Render/Upstash stability (dual-stack)
    keepAlive: 2000,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      if (times < 100) return delay;
      logger.error(`Redis [${role}]: Max retries reached (${times}). Giving up.`);
      return null;
    },
    reconnectOnError(err) {
      const targetErrors = ['READONLY', 'ECONNRESET', 'EPIPE'];
      if (targetErrors.some(te => err.message.includes(te))) {
        return true; 
      }
      return false;
    }
  };
};

/**
 * HARDENED ERROR HANDLER
 * Traces and suppresses raw ECONNRESET noise while preserving real failure visibility.
 */
const attachHardenedListeners = (client: Redis, role: string) => {
  client.on('error', (err) => {
    const isIdleReset = ['ECONNRESET', 'EPIPE', 'ETIMEDOUT'].some(code => 
      err.message?.includes(code) || (err as any).code === code
    );

    if (isIdleReset) {
      // PROMPT: "Avoid passing the raw error object to the logger for these specific codes"
      // This prevents the logger from dumping the stack trace to the console output.
      logger.debug(`Redis [${role}] idle connection reset (handled): ${err.message}`);
    } else {
      // Real failures still get full visibility
      logger.error(`Redis [${role}] connection error:`, err);
    }
  });

  client.once('ready', () => {
    logger.info(`Redis [${role}] connection established and ready`);
  });
};

let defaultClient: Redis | null = null;

/**
 * Returns a Redis client tailored to a specific role.
 * @param role 'default' (App/RateLimit), 'producer' (Queue), or 'worker' (Blocking Job handler)
 */
export const getRedisClient = (role: 'default' | 'producer' | 'worker' = 'default'): Redis => {
  // Use singleton for default role to conserve connections
  if (role === 'default' && defaultClient) {
    return defaultClient;
  }

  const url = env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is not defined in environment variables');
  }

  const isTLS = url.startsWith('rediss://');
  const options = {
    ...getOptionsByRole(role),
    ...(isTLS ? { tls: { rejectUnauthorized: false } } : {})
  };

  const client = new Redis(url, options);
  attachHardenedListeners(client, role);

  if (role === 'default') {
    defaultClient = client;
  }

  return client;
};
