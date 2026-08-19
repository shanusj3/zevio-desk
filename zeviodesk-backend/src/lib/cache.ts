/**
 * In-Memory & Redis Cache Utility
 */

const memoryCache = new Map<string, { value: any; expiresAt: number }>();

export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.value as T;
  },
  set: async (key: string, value: any, ttlSeconds = 300): Promise<void> => {
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },
  del: async (key: string): Promise<void> => {
    memoryCache.delete(key);
  },
  clear: async (): Promise<void> => {
    memoryCache.clear();
  },
};
