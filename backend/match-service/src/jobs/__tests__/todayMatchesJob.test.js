const cron = require('node-cron');
const redis = require('../../config/redis');
const apiFootballService = require('../../services/apiFootballService');

jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  setex: jest.fn().mockResolvedValue('OK'),
}));
jest.mock('../../services/apiFootballService');

const { startTodayMatchesJob, refreshTodayMatchesCache } = require('../todayMatchesJob');

const todayDate = () => new Date().toISOString().split('T')[0];

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ENABLE_TODAY_MATCHES_CRON;
});

describe('refreshTodayMatchesCache', () => {
  test('splits fixtures into club/international and warms all three cache keys from one fetch', async () => {
    apiFootballService.fetchTodayMatches.mockResolvedValue({
      response: [
        { fixture: { id: 101 }, league: { id: 39, name: 'Premier League' } }, // club
        { fixture: { id: 102 }, league: { id: 1, name: 'FIFA World Cup' } },  // international
        { fixture: { id: 103 }, league: { id: 999, name: 'Unsupported' } },   // dropped
      ],
    });

    await refreshTodayMatchesCache();

    expect(apiFootballService.fetchTodayMatches).toHaveBeenCalledTimes(1);

    const writes = Object.fromEntries(
      redis.setex.mock.calls.map(([key, ttl, value]) => [key, { ttl, value: JSON.parse(value) }])
    );

    expect(Object.keys(writes).sort()).toEqual(
      ['matches:club:today', 'matches:international:today', `cache:/matches/date/${todayDate()}`].sort()
    );

    // Every key shares the route's own 5-minute TTL, so a cache HIT there
    // never outlives what this job just wrote.
    expect(writes['matches:club:today'].ttl).toBe(300);
    expect(writes['matches:international:today'].ttl).toBe(300);
    expect(writes[`cache:/matches/date/${todayDate()}`].ttl).toBe(300);

    expect(writes['matches:club:today'].value).toEqual({
      success: true,
      response: [expect.objectContaining({ fixture: { id: 101 }, competition_type: 'club' })],
      results: 1,
    });
    expect(writes['matches:international:today'].value).toEqual({
      success: true,
      response: [expect.objectContaining({ fixture: { id: 102 }, competition_type: 'international' })],
      results: 1,
    });

    // Bug 2 fix: this is the exact key + shape GET /matches/date/:date reads,
    // so a real page load hits it as a cache HIT instead of re-fetching.
    expect(writes[`cache:/matches/date/${todayDate()}`].value).toEqual({
      success: true,
      club: [expect.objectContaining({ fixture: { id: 101 }, competition_type: 'club' })],
      international: [expect.objectContaining({ fixture: { id: 102 }, competition_type: 'international' })],
    });
  });

  test('an upstream failure does not throw and writes nothing', async () => {
    apiFootballService.fetchTodayMatches.mockRejectedValue(new Error('quota exceeded'));

    await expect(refreshTodayMatchesCache()).resolves.toBeUndefined();
    expect(redis.setex).not.toHaveBeenCalled();
  });
});

describe('startTodayMatchesJob', () => {
  test('registers the 5-minute schedule and warms the cache immediately by default', async () => {
    apiFootballService.fetchTodayMatches.mockResolvedValue({ response: [] });

    startTodayMatchesJob();
    await Promise.resolve();

    expect(cron.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
    expect(apiFootballService.fetchTodayMatches).toHaveBeenCalledTimes(1);
  });

  test('ENABLE_TODAY_MATCHES_CRON=false registers nothing and makes no upstream call', async () => {
    process.env.ENABLE_TODAY_MATCHES_CRON = 'false';

    startTodayMatchesJob();
    await Promise.resolve();

    expect(cron.schedule).not.toHaveBeenCalled();
    expect(apiFootballService.fetchTodayMatches).not.toHaveBeenCalled();
  });
});
