const Redis = require('ioredis');
const logger = require('../utils/logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // Exponential backoff: wait up to 3s between retries
  retryStrategy: (times) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false, // fail fast if Redis is down
});

let isRedisConnected = false;

redis.on('connect', () => {
  isRedisConnected = true;
  logger.info('Redis connected');
});
redis.on('ready', () => {
  isRedisConnected = true;
  logger.info('Redis ready');
});
redis.on('error', (err) => {
  isRedisConnected = false;
  logger.error('Redis error', { error: err.message });
});
redis.on('close', () => {
  isRedisConnected = false;
  logger.warn('Redis connection closed');
});

// ── In-memory fallback ───────────────────────────────────────────────────────
// Keeps the service serving while Redis is unreachable. Bounded and LRU-evicting:
// expiry was previously only checked on read, so keys written and never read
// again accumulated for the lifetime of the process.
//
// Each entry is one API-Football response (a few KB), so this caps the fallback
// at roughly a few tens of MB. It is per-process, meaning replicas each hold
// their own copy — acceptable for a cache, and part of why this is a fallback
// rather than the design.
const MAX_FALLBACK_ENTRIES = 1000;
const inMemoryCache = new Map();

function fallbackSet(key, value, ttlSeconds) {
  // Re-inserting moves the key to the end of Map iteration order, which is what
  // makes the eviction below least-recently-used.
  inMemoryCache.delete(key);
  inMemoryCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });

  while (inMemoryCache.size > MAX_FALLBACK_ENTRIES) {
    const oldest = inMemoryCache.keys().next().value;
    inMemoryCache.delete(oldest);
  }
}

function fallbackGet(key) {
  const item = inMemoryCache.get(key);
  if (!item) return null;
  if (item.expiry && Date.now() > item.expiry) {
    inMemoryCache.delete(key);
    return null;
  }
  inMemoryCache.delete(key);
  inMemoryCache.set(key, item);
  return item.value;
}

const wrapper = {
  async ping() {
    if (!isRedisConnected) {
      try {
        await redis.ping();
      } catch (err) {
        logger.warn('Redis ping failed, using in-memory fallback', { error: err.message });
      }
    }
    return 'PONG';
  },

  async get(key) {
    if (isRedisConnected) {
      try {
        return await redis.get(key);
      } catch (err) {
        logger.error('Redis GET error', { error: err.message, key });
      }
    }
    return fallbackGet(key);
  },

  async setex(key, ttl, value) {
    if (isRedisConnected) {
      try {
        return await redis.setex(key, ttl, value);
      } catch (err) {
        logger.error('Redis SETEX error', { error: err.message, key });
      }
    }
    fallbackSet(key, value, ttl);
    return 'OK';
  },

  on(event, handler) {
    redis.on(event, handler);
  },
};

module.exports = wrapper;
