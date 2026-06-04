const Redis = require('ioredis');

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
  console.log('[match-service] Redis connected');
});
redis.on('ready', () => {
  isRedisConnected = true;
  console.log('[match-service] Redis ready');
});
redis.on('error', (err) => {
  isRedisConnected = false;
  console.error('[match-service] Redis error:', err.message);
});
redis.on('close', () => {
  isRedisConnected = false;
  console.warn('[match-service] Redis connection closed');
});

// Simple In-Memory Cache Fallback
const inMemoryCache = new Map();

const wrapper = {
  async ping() {
    if (!isRedisConnected) {
      try {
        await redis.ping();
      } catch (err) {
        console.warn('[match-service] Redis ping failed, using in-memory fallback');
      }
    }
    return 'PONG';
  },

  async get(key) {
    if (isRedisConnected) {
      try {
        return await redis.get(key);
      } catch (err) {
        console.error('[match-service] Redis GET error:', err.message);
      }
    }
    const item = inMemoryCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      inMemoryCache.delete(key);
      return null;
    }
    return item.value;
  },

  async setex(key, ttl, value) {
    if (isRedisConnected) {
      try {
        return await redis.setex(key, ttl, value);
      } catch (err) {
        console.error('[match-service] Redis SETEX error:', err.message);
      }
    }
    inMemoryCache.set(key, {
      value,
      expiry: Date.now() + (ttl * 1000),
    });
    return 'OK';
  },

  on(event, handler) {
    redis.on(event, handler);
  }
};

module.exports = wrapper;
