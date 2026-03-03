'use strict';

/**
 * Three separate ioredis connections are required:
 *
 *  redis      — general key/value operations (GET, SET, SETEX …)
 *  subscriber — enters subscriber mode; can ONLY run subscribe commands
 *  publisher  — used by internal endpoints to publish events to other services
 *
 * ioredis automatically moves a connection into subscriber mode when
 * .subscribe() is called, which is why we cannot reuse one connection for
 * both pub/sub and normal commands.
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

const BASE_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // Exponential back-off: 100ms → 200ms … capped at 3s
  retryStrategy: (times) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  lazyConnect: false,
};

function createClient(role) {
  const client = new Redis(BASE_CONFIG);

  client.on('connect', () =>
    logger.info('Redis connection established', { role })
  );
  client.on('ready', () =>
    logger.info('Redis ready', { role })
  );
  client.on('error', (err) =>
    logger.error('Redis error', { role, error: err.message })
  );
  client.on('close', () =>
    logger.warn('Redis connection closed', { role })
  );
  client.on('reconnecting', (ms) =>
    logger.warn('Redis reconnecting', { role, delayMs: ms })
  );

  return client;
}

const redis      = createClient('client');
const subscriber = createClient('subscriber');
const publisher  = createClient('publisher');

module.exports = { redis, subscriber, publisher };
