import { logger } from "../config/logger.js";
import { cache } from "../lib/cache.js";

export const redisService = {
  get: async (key: string): Promise<string | null> => {
    return cache.get<string>(key);
  },

  set: async (key: string, value: string, ttlSeconds = 300): Promise<void> => {
    logger.info(`🔴 [RedisService] SET key=${key} ttl=${ttlSeconds}s`);
    return cache.set(key, value, ttlSeconds);
  },

  del: async (key: string): Promise<void> => {
    logger.info(`🔴 [RedisService] DEL key=${key}`);
    return cache.del(key);
  },
};
