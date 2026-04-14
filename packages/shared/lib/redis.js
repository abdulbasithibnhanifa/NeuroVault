"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("@neurovault/shared/config/env");
const logger_1 = require("@neurovault/shared/utils/logger");
let redisClient = null;
/**
 * Returns a singleton Redis client instance.
 * Used for BullMQ queues, caching, and rate limiting.
 */
function getRedisClient() {
    if (!redisClient) {
        logger_1.logger.info('Initializing Redis client...');
        const redisOptions = {
            maxRetriesPerRequest: null, // Required for BullMQ
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        };
        if (env_1.env.REDIS_URL) {
            const isTLS = env_1.env.REDIS_URL.startsWith('rediss://');
            redisClient = new ioredis_1.default(env_1.env.REDIS_URL, {
                ...redisOptions,
                ...(isTLS ? { tls: { rejectUnauthorized: false } } : {})
            });
        }
        else {
            redisClient = new ioredis_1.default({
                host: env_1.env.REDIS_HOST,
                port: env_1.env.REDIS_PORT,
                ...redisOptions
            });
        }
        redisClient.on('error', (err) => {
            logger_1.logger.error('Redis error:', err);
        });
        redisClient.on('connect', () => {
            logger_1.logger.info('Redis connected successfully');
        });
    }
    return redisClient;
}
