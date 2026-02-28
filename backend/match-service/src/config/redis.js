const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // Exponential backoff: wait up to 3s between retries
  retryStrategy: (times) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false, // fail fast if Redis is down; don't queue commands
});

redis.on('connect', () => console.log('[match-service] Redis connected'));
redis.on('ready', () => console.log('[match-service] Redis ready'));
redis.on('error', (err) => console.error('[match-service] Redis error:', err.message));
redis.on('close', () => console.warn('[match-service] Redis connection closed'));

module.exports = redis;
