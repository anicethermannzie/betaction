const { cache } = require('../cacheMiddleware');
const redis = require('../../config/redis');

jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  setex: jest.fn().mockResolvedValue('OK'),
}));

/** Minimal Express double that records what the handler chain produced. */
function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return res;
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  jest.clearAllMocks();
  redis.get.mockResolvedValue(null);
});

describe('cacheMiddleware', () => {
  test('uses the key builder supplied at route definition', async () => {
    const req = { originalUrl: '/matches/h2h/40/33', params: { team1Id: '40', team2Id: '33' } };
    const res = makeRes();
    const keyFor = (r) => `cache:/matches/h2h/${[r.params.team1Id, r.params.team2Id].sort()}`;

    await cache(60, keyFor)(req, res, () => {});

    // The builder's key must reach Redis. Before the fix, controllers assigned
    // req.cacheKey after this middleware had already resolved one, so explicit
    // keys were silently ignored and URL-derived keys were used instead.
    expect(redis.get).toHaveBeenCalledWith(keyFor(req));
    expect(req.cacheKey).toBe(keyFor(req));
  });

  test('falls back to the request URL when no builder is given', async () => {
    const req = { originalUrl: '/leagues', params: {} };
    await cache(60)(req, makeRes(), () => {});
    expect(redis.get).toHaveBeenCalledWith('cache:/leagues');
  });

  test('serves a hit without invoking the handler', async () => {
    redis.get.mockResolvedValue(JSON.stringify({ success: true, cached: 'yes' }));
    const req = { originalUrl: '/matches/1', params: {} };
    const res = makeRes();
    const next = jest.fn();

    await cache(60)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.headers['X-Cache']).toBe('HIT');
    expect(res.body).toEqual({ success: true, cached: 'yes' });
  });

  test('stores a successful response under both the fresh and stale keys', async () => {
    const req = { originalUrl: '/matches/1', params: {} };
    const res = makeRes();

    await cache(60)(req, res, () => {});
    res.json({ success: true });
    await flush();

    expect(redis.setex).toHaveBeenCalledWith('cache:/matches/1', 60, '{"success":true}');
    expect(redis.setex).toHaveBeenCalledWith('stale:cache:/matches/1', expect.any(Number), '{"success":true}');
  });

  test('does not cache error responses', async () => {
    const req = { originalUrl: '/matches/1', params: {} };
    const res = makeRes();

    await cache(60)(req, res, () => {});
    res.status(502).json({ error: 'upstream' });
    await flush();

    expect(redis.setex).not.toHaveBeenCalled();
  });

  test('serves the last good copy when the upstream fails', async () => {
    const req = { originalUrl: '/matches/1', params: {} };
    const res = makeRes();

    redis.get.mockResolvedValueOnce(null);                                  // fresh miss
    redis.get.mockResolvedValueOnce(JSON.stringify({ success: true, n: 1 })); // stale hit

    await cache(60)(req, res, () => {});
    await res.status(502).json({ error: 'Failed to fetch match' });
    await flush();

    expect(res.statusCode).toBe(200);
    expect(res.headers['X-Cache']).toBe('STALE');
    expect(res.body).toEqual({ success: true, n: 1 });
  });

  test('passes the error through when no stale copy exists', async () => {
    const req = { originalUrl: '/matches/1', params: {} };
    const res = makeRes();
    redis.get.mockResolvedValue(null);

    await cache(60)(req, res, () => {});
    await res.status(502).json({ error: 'Failed to fetch match' });
    await flush();

    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ error: 'Failed to fetch match' });
  });

  test('stale serving can be disabled for live data', async () => {
    const req = { originalUrl: '/matches/live', params: {} };
    const res = makeRes();

    await cache(30, undefined, { staleTtl: 0 })(req, res, () => {});
    res.json({ success: true });
    await flush();

    expect(redis.setex).toHaveBeenCalledTimes(1);
    expect(redis.setex).toHaveBeenCalledWith('cache:/matches/live', 30, '{"success":true}');
  });

  test('a Redis outage never fails the request', async () => {
    redis.get.mockRejectedValue(new Error('ECONNREFUSED'));
    const req = { originalUrl: '/matches/1', params: {} };
    const next = jest.fn();

    await cache(60)(req, makeRes(), next);

    expect(next).toHaveBeenCalled();
  });

  describe('ttlSeconds as a function of the request', () => {
    test('resolves the TTL from the request before the handler runs', async () => {
      const req = { originalUrl: '/matches/1/events', params: {}, query: { live: 'true' } };
      const res = makeRes();
      const ttlFor = (r) => (r.query.live === 'true' ? 30 : 3600);

      await cache(ttlFor)(req, res, () => {});
      res.json({ success: true });
      await flush();

      expect(redis.setex).toHaveBeenCalledWith('cache:/matches/1/events', 30, '{"success":true}');
    });

    test('picks a different TTL for a different request without changing the route definition', async () => {
      const res = makeRes();
      const ttlFor = (r) => (r.query.live === 'true' ? 30 : 3600);

      await cache(ttlFor)({ originalUrl: '/x', params: {}, query: {} }, res, () => {});
      res.json({ success: true });
      await flush();

      expect(redis.setex).toHaveBeenCalledWith('cache:/x', 3600, '{"success":true}');
    });

    test('a ttl function that throws bypasses the cache instead of failing the request', async () => {
      const req = { originalUrl: '/x', params: {}, query: {} };
      const next = jest.fn();
      const ttlFor = () => { throw new Error('boom'); };

      await cache(ttlFor)(req, makeRes(), next);

      expect(next).toHaveBeenCalled();
      expect(redis.get).not.toHaveBeenCalled();
    });
  });
});
