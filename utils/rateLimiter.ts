import { getRedisClient } from '@/lib/redis';
import { logger } from '@/utils/logger';

export class RateLimiter {
  private redis = getRedisClient();

  /**
   * Checks if the user has exceeded the rate limit for a specific endpoint.
   * Uses a sliding window (1 minute) implemented with Redis.
   * 
   * @param userId The unique ID of the user
   * @param endpoint The unique name of the endpoint (e.g., 'chat_api')
   * @param limit The maximum number of requests allowed per minute (default 60)
   * @returns Promise<boolean> true if allowed, false if limited
   */
  async checkLimit(userId: string, endpoint: string, limit: number = 60): Promise<boolean> {
    try {
      const key = `ratelimit:${endpoint}:${userId}`;
      const now = Date.now();
      const windowStart = now - 60000; // 1 minute window

      // Multi-transaction to clean old entries and count current ones
      const multi = this.redis.multi();
      
      // 1. Remove entries older than 1 minute
      multi.zremrangebyscore(key, 0, windowStart);
      
      // 2. Add current request
      multi.zadd(key, now, now.toString());
      
      // 3. Count total requests in the window
      multi.zcard(key);
      
      // 4. Set expiration for the whole key to clean up disk/memory
      multi.expire(key, 60);

      const [,, zcardResult] = await multi.exec() as any[];
      const requestCount = zcardResult[1] as number;

      if (requestCount > limit) {
        logger.warn('Rate limit exceeded', { userId, endpoint, limit, requestCount });
        return false;
      }

      return true;
    } catch (error: any) {
      logger.error('RateLimiter error:', error);
      // Fallback: allow request if Redis fails to avoid breaking core functionality
      return true;
    }
  }
}
