'use strict';

const crypto = require('crypto');
const logger = require('../utils/logger');

const HEADER_NAME = 'x-internal-api-key';

// Hash both sides to a fixed-length digest before comparing, so
// crypto.timingSafeEqual never has to branch on (and leak) the raw
// header's length.
function safeEqual(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Guards service-to-service endpoints (POST /notify/match-event, GET /stats)
 * behind a shared secret sent as the X-Internal-Api-Key header.
 *
 * These are called by other microservices, not by end users or the
 * frontend, so the user-session JWT (JWT_SECRET) doesn't apply here — this
 * is a separate, internal-only credential.
 *
 * Fails closed: if INTERNAL_API_KEY isn't configured, every request is
 * rejected (500) rather than silently let through.
 */
function requireInternalKey(req, res, next) {
  const expected = process.env.INTERNAL_API_KEY;

  if (!expected) {
    logger.error('INTERNAL_API_KEY is not configured — rejecting internal request', {
      path: req.path,
    });
    return res.status(500).json({ error: 'Service misconfigured' });
  }

  const provided = req.headers[HEADER_NAME];

  if (!provided || !safeEqual(provided, expected)) {
    logger.warn('Rejected internal request with missing/invalid API key', {
      path: req.path,
      ip: req.ip,
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

module.exports = { requireInternalKey };
