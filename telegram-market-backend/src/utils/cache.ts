import NodeCache from 'node-cache';
import logger from './logger';

// Cache configuration
const cacheConfig = {
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Better performance for large objects
};

export const cache = new NodeCache(cacheConfig);

// Cache key generators
export const CacheKeys = {
  productFeed: (page: number, limit: number) => `products:feed:${page}:${limit}`,
  pendingProducts: (page: number, limit: number) => `products:pending:${page}:${limit}`,
  user: (telegramId: string) => `user:${telegramId}`,
  invite: (code: string) => `invite:${code}`,
  product: (id: string) => `product:${id}`
};

// Cache helper functions
export const cacheService = {
  get: <T>(key: string): T | undefined => {
    const value = cache.get<T>(key);
    if (value !== undefined) {
      logger.debug('Cache hit', { key });
    }
    return value;
  },

  set: <T>(key: string, value: T, ttl?: number): boolean => {
    const success = cache.set(key, value, ttl || cacheConfig.stdTTL);
    if (success) {
      logger.debug('Cache set', { key, ttl: ttl || cacheConfig.stdTTL });
    }
    return success;
  },

  del: (key: string | string[]): number => {
    const deleted = cache.del(key);
    logger.debug('Cache deleted', { key, count: deleted });
    return deleted;
  },

  // Clear all cache entries matching a pattern
  clearPattern: (pattern: string): number => {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    if (matchingKeys.length > 0) {
      return cache.del(matchingKeys);
    }
    return 0;
  },

  // Clear all product-related cache
  clearProductCache: (): void => {
    cacheService.clearPattern('products:');
    logger.info('Product cache cleared');
  },

  // Get cache stats
  getStats: () => {
    return cache.getStats();
  }
};

// Log cache stats on startup
cache.on('set', (key) => {
  logger.debug('Cache key set', { key });
});

cache.on('del', (key) => {
  logger.debug('Cache key deleted', { key });
});

cache.on('expired', (key) => {
  logger.debug('Cache key expired', { key });
});

