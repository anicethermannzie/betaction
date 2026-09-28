const cron = require('node-cron');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const apiFootballService = require('../services/apiFootballService');
const cacheKeys = require('../utils/cacheKeys');
const { cache } = require('../middleware/cacheMiddleware');

/**
 * Live-matches polling used to be a single unconditional cron.schedule('*\/30
 * * * * * *') — one API-Football call every 30 seconds, forever, whether or
 * not a live match existed anywhere. That alone burns a 100-request/day quota
 * in under an hour of plain container uptime (see docs/... quota
 * investigation). The fix: a lightweight Redis flag records whether the last
 * fetch found any live fixture, and two schedules consult it before ever
 * calling upstream — only one of them ever actually fetches on a given tick.
 */

const LIVE_CACHE_KEY = cacheKeys.liveMatches();
const LIVE_CACHE_TTL = cache.TTL.LIVE; // 30s — how long a fetched response stays servable

const LIVE_FLAG_KEY = 'flag:live_matches_active';
// A little over 2x the active-poll interval: survives one slow/missed tick
// without flapping, but still expires on its own within minutes if updates
// stop — so a stuck flag fails toward the cheap 5-minute schedule, not
// toward polling every 30s forever.
const LIVE_FLAG_TTL = 75;

const ACTIVE_SCHEDULE = '*/30 * * * * *'; // while a live match is known to exist
const IDLE_SCHEDULE = '*/5 * * * *'; // otherwise, just to notice a new one starting

async function hasKnownLiveMatches() {
  return (await redis.get(LIVE_FLAG_KEY)) === '1';
}

/**
 * Fetches live fixtures, refreshes the response cache GET /matches/live
 * reads, and updates the flag both schedules below check before calling
 * upstream. Shared by both ticks and by the immediate startup warm-up.
 */
async function refreshLiveMatches() {
  const data = await apiFootballService.getLiveMatches();
  await redis.setex(LIVE_CACHE_KEY, LIVE_CACHE_TTL, JSON.stringify({ success: true, ...data }));

  const liveCount = Array.isArray(data?.response) ? data.response.length : 0;
  await redis.setex(LIVE_FLAG_KEY, LIVE_FLAG_TTL, liveCount > 0 ? '1' : '0');

  logger.debug('Live matches cache refreshed', { liveMatches: liveCount });
  return liveCount;
}

async function activeTick() {
  try {
    if (!(await hasKnownLiveMatches())) return; // nothing live — the idle tick owns detection
    await refreshLiveMatches();
  } catch (err) {
    logger.error('Live matches cache refresh failed', { error: err.message });
  }
}

async function idleTick() {
  try {
    if (await hasKnownLiveMatches()) return; // the 30s tick already has this covered
    await refreshLiveMatches();
  } catch (err) {
    logger.error('Live matches cache refresh failed', { error: err.message });
  }
}

function startLiveMatchesJob() {
  if (process.env.ENABLE_LIVE_POLLING === 'false') {
    logger.info('Live matches polling disabled (ENABLE_LIVE_POLLING=false)');
    return;
  }

  cron.schedule(ACTIVE_SCHEDULE, activeTick);
  cron.schedule(IDLE_SCHEDULE, idleTick);
  logger.info('Live matches refresh job scheduled', {
    active: '30s while a live match is known',
    idle: '5m otherwise, to detect a new one starting',
  });

  // Establishes the flag immediately instead of waiting up to 5 minutes for
  // the first idle tick to run.
  refreshLiveMatches().catch((err) =>
    logger.error('Live matches cache refresh failed', { error: err.message })
  );
}

module.exports = {
  startLiveMatchesJob,
  refreshLiveMatches,
  hasKnownLiveMatches,
  activeTick,
  idleTick,
};
