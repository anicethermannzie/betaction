jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  setex: jest.fn().mockResolvedValue('OK'),
}));

const redis = require('../../config/redis');
const { trackOddsSnapshot } = require('../oddsTracker');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('trackOddsSnapshot', () => {
  test('the first snapshot for a fixture reports every outcome as stable', async () => {
    redis.get.mockResolvedValue(null);

    const movement = await trackOddsSnapshot(1, { home_odds: 1.80, draw_odds: 3.40, away_odds: 4.20 });

    expect(movement).toEqual({ home: 'stable', draw: 'stable', away: 'stable' });
  });

  test('detects an increase as "up" and a decrease as "down"', async () => {
    redis.get.mockResolvedValue(JSON.stringify([
      { timestamp: 't0', home_odds: 1.80, draw_odds: 3.40, away_odds: 4.20 },
    ]));

    // home dropped (more likely), draw and away rose (less likely) — matches
    // the pattern described in the SofaScore-inspired spec.
    const movement = await trackOddsSnapshot(1, { home_odds: 1.70, draw_odds: 3.60, away_odds: 4.50 });

    expect(movement).toEqual({ home: 'down', draw: 'up', away: 'up' });
  });

  test('a change below the noise threshold is reported as stable', async () => {
    redis.get.mockResolvedValue(JSON.stringify([
      { timestamp: 't0', home_odds: 1.80, draw_odds: 3.40, away_odds: 4.20 },
    ]));

    const movement = await trackOddsSnapshot(1, { home_odds: 1.803, draw_odds: 3.40, away_odds: 4.199 });

    expect(movement).toEqual({ home: 'stable', draw: 'stable', away: 'stable' });
  });

  test('keeps only the most recent 20 snapshots', async () => {
    const twentyExisting = Array.from({ length: 20 }, (_, i) => ({
      timestamp: `t${i}`, home_odds: 1.5 + i * 0.01, draw_odds: 3.0, away_odds: 4.0,
    }));
    redis.get.mockResolvedValue(JSON.stringify(twentyExisting));

    await trackOddsSnapshot(1, { home_odds: 2.0, draw_odds: 3.0, away_odds: 4.0 });

    const [, storedTtl, storedPayload] = redis.setex.mock.calls[0];
    const stored = JSON.parse(storedPayload);
    expect(stored).toHaveLength(20);
    expect(stored[stored.length - 1].home_odds).toBe(2.0);
    expect(stored[0].timestamp).toBe('t1'); // oldest (t0) was evicted
    expect(storedTtl).toBe(24 * 60 * 60);
  });

  test('a Redis read failure is treated as no history, not a thrown error', async () => {
    redis.get.mockRejectedValue(new Error('ECONNREFUSED'));

    const movement = await trackOddsSnapshot(1, { home_odds: 1.80, draw_odds: 3.40, away_odds: 4.20 });

    expect(movement).toEqual({ home: 'stable', draw: 'stable', away: 'stable' });
  });

  test('a Redis write failure does not prevent the movement result from being returned', async () => {
    redis.get.mockResolvedValue(null);
    redis.setex.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      trackOddsSnapshot(1, { home_odds: 1.80, draw_odds: 3.40, away_odds: 4.20 })
    ).resolves.toEqual({ home: 'stable', draw: 'stable', away: 'stable' });
  });

  test('non-numeric odds are coerced to 0 rather than corrupting the stored history', async () => {
    redis.get.mockResolvedValue(null);

    await trackOddsSnapshot(1, { home_odds: 'N/A', draw_odds: 3.40, away_odds: 4.20 });

    const stored = JSON.parse(redis.setex.mock.calls[0][2]);
    expect(stored[0].home_odds).toBe(0);
  });
});
