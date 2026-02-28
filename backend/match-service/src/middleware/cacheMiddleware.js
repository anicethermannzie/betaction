const redis = require('../config/redis');

/**
 * Factory that returns an Express middleware performing read-through Redis caching.
 *
 * Cache key: req.cacheKey (set by the controller before calling next) or req.originalUrl.
 * On cache HIT  → respond immediately with the cached JSON, sets X-Cache: HIT header.
 * On cache MISS → let the request proceed normally, intercept res.json() to store the
 *                 successful response in Redis before sending it to the client.
 * On Redis error → silently falls through to the real handler (graceful degradation).
 *
 * @param {number} ttlSeconds - How long to keep the cached response.
 */
function cache(ttlSeconds) {
  return async (req, res, next) => {
    // Support explicit key set upstream (e.g. normalized h2h key), fall back to URL
    const key = req.cacheKey || `cache:${req.originalUrl}`;

    // ── Cache read ───────────────────────────────────────────────────────────
    try {
      const cached = await redis.get(key);
      if (cached !== null) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', key);
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (err) {
      // Redis unavailable — degrade gracefully, don't block the request
      console.error('[cacheMiddleware] Redis GET error:', err.message);
      return next();
    }

    // ── Cache write (intercept res.json) ─────────────────────────────────────
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-Key', key);

    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      // Only cache 2xx responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await redis.setex(key, ttlSeconds, JSON.stringify(body));
        } catch (err) {
          console.error('[cacheMiddleware] Redis SET error:', err.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
}

// ── TTL presets (in seconds) ─────────────────────────────────────────────────
cache.TTL = {
  LIVE: 30,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 5 * 60,
  ONE_HOUR: 60 * 60,
  ONE_DAY: 24 * 60 * 60,
};

module.exports = { cache };
