const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Factory that returns an Express middleware performing read-through Redis caching.
 *
 * Cache key: `keyFor(req)` when supplied, else `cache:${req.originalUrl}`.
 *
 * The key USED to be read from `req.cacheKey`, which controllers set inside their
 * handlers — i.e. after this middleware had already run and captured the key. So
 * every explicit key was silently ignored: head-to-head pairs cached under two
 * different keys depending on team order (doubling API-Football usage on the most
 * expensive endpoint), and season-aware keys never applied. Passing the key
 * builder in at route definition makes it available before the request runs,
 * which is the only point at which the cache can act on it.
 *
 * Behaviour:
 *   HIT            → respond with the cached JSON, `X-Cache: HIT`.
 *   MISS           → run the handler, then store a successful response.
 *   Upstream error → serve the last good copy if one is still on hand,
 *                    `X-Cache: STALE` (see options.staleTtl).
 *   Redis error    → fall through to the handler; the cache never fails a request.
 *
 * @param {number} ttlSeconds - How long the response stays fresh.
 * @param {(req: import('express').Request) => string} [keyFor] - Explicit key builder.
 * @param {{ staleTtl?: number }} [options] - staleTtl 0 disables stale serving.
 */
function cache(ttlSeconds, keyFor, options = {}) {
  // How long a superseded copy is kept for emergencies. API-Football outages and
  // rate-limit windows are measured in minutes-to-hours; six hours covers those
  // without ever serving something a user would mistake for current.
  const staleTtl = options.staleTtl ?? 6 * 60 * 60;

  return async (req, res, next) => {
    let key;
    try {
      key = keyFor ? keyFor(req) : `cache:${req.originalUrl}`;
    } catch (err) {
      // A key builder that throws (unexpected params) must not fail the request.
      logger.warn('Cache key builder failed; bypassing cache', { error: err.message, path: req.originalUrl });
      return next();
    }

    // Exposed for cron jobs and handlers that want to know their own key. Unlike
    // before, this is set *before* the handler runs, so it is actually usable.
    req.cacheKey = key;
    const staleKey = `stale:${key}`;

    // ── Cache read ───────────────────────────────────────────────────────────
    try {
      const cached = await redis.get(key);
      if (cached !== null) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (err) {
      // Redis unavailable — degrade gracefully, don't block the request
      logger.error('Redis GET error', { error: err.message, key });
      return next();
    }

    // ── Cache write / stale fallback (intercept res.json) ────────────────────
    res.setHeader('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    res.json = (body) => {
      const status = res.statusCode;

      if (status >= 200 && status < 300) {
        const payload = JSON.stringify(body);
        // Not awaited: the client should not wait on a cache write, and a
        // failure here is a logged warning rather than a failed response.
        redis.setex(key, ttlSeconds, payload)
          .catch((err) => logger.error('Redis SET error', { error: err.message, key }));
        if (staleTtl > 0) {
          redis.setex(staleKey, staleTtl, payload)
            .catch((err) => logger.error('Redis stale SET error', { error: err.message, key: staleKey }));
        }
        return originalJson(body);
      }

      // Upstream failed (API-Football down, rate-limited, timing out). A copy
      // from within the stale window is far more useful to a paying customer
      // than a 502, as long as it is labelled.
      if (staleTtl > 0 && status >= 500) {
        return redis.get(staleKey)
          .then((stale) => {
            if (stale === null) return originalJson(body);
            logger.warn('Serving stale cache after upstream failure', { key, status });
            res.setHeader('X-Cache', 'STALE');
            originalStatus(200);
            return originalJson(JSON.parse(stale));
          })
          .catch(() => originalJson(body));
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
