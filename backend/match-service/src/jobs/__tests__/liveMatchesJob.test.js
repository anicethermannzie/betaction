const cron = require('node-cron');
const redis = require('../../config/redis');
const apiFootballService = require('../../services/apiFootballService');

jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  setex: jest.fn().mockResolvedValue('OK'),
}));
jest.mock('../../services/apiFootballService');

const {
  startLiveMatchesJob,
  refreshLiveMatches,
  hasKnownLiveMatches,
  activeTick,
  idleTick,
} = require('../liveMatchesJob');

beforeEach(() => {
  jest.clearAllMocks();
  redis.get.mockResolvedValue(null);
  delete process.env.ENABLE_LIVE_POLLING;
});

describe('hasKnownLiveMatches', () => {
  test('true only when the flag is exactly "1"', async () => {
    redis.get.mockResolvedValueOnce('1');
    expect(await hasKnownLiveMatches()).toBe(true);

    redis.get.mockResolvedValueOnce('0');
    expect(await hasKnownLiveMatches()).toBe(false);

    redis.get.mockResolvedValueOnce(null); // no flag yet (cold start, or expired)
    expect(await hasKnownLiveMatches()).toBe(false);
  });
});

describe('refreshLiveMatches', () => {
  test('caches the response and sets the flag when matches are live', async () => {
    apiFootballService.getLiveMatches.mockResolvedValue({ response: [{ fixture: { id: 1 } }] });

    const count = await refreshLiveMatches();

    expect(count).toBe(1);
    expect(redis.setex).toHaveBeenCalledWith(
      'cache:/matches/live', 30, JSON.stringify({ success: true, response: [{ fixture: { id: 1 } }] })
    );
    expect(redis.setex).toHaveBeenCalledWith('flag:live_matches_active', 75, '1');
  });

  test('clears the flag to "0" when nothing is live', async () => {
    apiFootballService.getLiveMatches.mockResolvedValue({ response: [] });

    const count = await refreshLiveMatches();

    expect(count).toBe(0);
    expect(redis.setex).toHaveBeenCalledWith('flag:live_matches_active', 75, '0');
  });
});

describe('activeTick (the 30s schedule)', () => {
  test('skips the upstream call when no live match is known', async () => {
    redis.get.mockResolvedValue(null);

    await activeTick();

    expect(apiFootballService.getLiveMatches).not.toHaveBeenCalled();
  });

  test('calls upstream when a live match is known', async () => {
    redis.get.mockResolvedValue('1');
    apiFootballService.getLiveMatches.mockResolvedValue({ response: [] });

    await activeTick();

    expect(apiFootballService.getLiveMatches).toHaveBeenCalledTimes(1);
  });

  test('a failed refresh does not throw', async () => {
    redis.get.mockResolvedValue('1');
    apiFootballService.getLiveMatches.mockRejectedValue(new Error('upstream down'));

    await expect(activeTick()).resolves.toBeUndefined();
  });
});

describe('idleTick (the 5-minute schedule)', () => {
  test('calls upstream when no live match is known, to detect a new one', async () => {
    redis.get.mockResolvedValue(null);
    apiFootballService.getLiveMatches.mockResolvedValue({ response: [] });

    await idleTick();

    expect(apiFootballService.getLiveMatches).toHaveBeenCalledTimes(1);
  });

  test('skips the upstream call when the 30s tick already has it covered', async () => {
    redis.get.mockResolvedValue('1');

    await idleTick();

    expect(apiFootballService.getLiveMatches).not.toHaveBeenCalled();
  });
});

describe('startLiveMatchesJob', () => {
  test('registers both schedules and warms the flag immediately by default', async () => {
    apiFootballService.getLiveMatches.mockResolvedValue({ response: [] });

    startLiveMatchesJob();
    await Promise.resolve(); // flush the immediate warm-up call

    expect(cron.schedule).toHaveBeenCalledTimes(2);
    expect(cron.schedule).toHaveBeenCalledWith('*/30 * * * * *', expect.any(Function));
    expect(cron.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
    expect(apiFootballService.getLiveMatches).toHaveBeenCalledTimes(1);
  });

  test('ENABLE_LIVE_POLLING=false registers nothing and makes no upstream call', async () => {
    process.env.ENABLE_LIVE_POLLING = 'false';

    startLiveMatchesJob();
    await Promise.resolve();

    expect(cron.schedule).not.toHaveBeenCalled();
    expect(apiFootballService.getLiveMatches).not.toHaveBeenCalled();
  });

  test('any value other than the literal string "false" is treated as enabled', async () => {
    process.env.ENABLE_LIVE_POLLING = 'true';
    apiFootballService.getLiveMatches.mockResolvedValue({ response: [] });

    startLiveMatchesJob();
    await Promise.resolve();

    expect(cron.schedule).toHaveBeenCalledTimes(2);
  });
});
