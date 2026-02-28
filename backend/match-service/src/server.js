require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const redis = require('./config/redis');
const apiFootballService = require('./services/apiFootballService');

const PORT = process.env.PORT || 3002;
const LIVE_CACHE_KEY = 'cache:/matches/live';
const LIVE_CACHE_TTL = 30; // seconds

// ── Scheduled jobs ───────────────────────────────────────────────────────────

/**
 * Refresh the live matches cache every 30 seconds.
 * This keeps the cache warm so users always get a fast response,
 * while limiting the number of API-Football calls to 2 per minute.
 */
function startLiveMatchesJob() {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const data = await apiFootballService.getLiveMatches();
      await redis.setex(LIVE_CACHE_KEY, LIVE_CACHE_TTL, JSON.stringify({ success: true, ...data }));
      console.log('[match-service] Live matches cache refreshed');
    } catch (err) {
      console.error('[match-service] Live matches cache refresh failed:', err.message);
    }
  });
  console.log('[match-service] Live matches refresh job scheduled (every 30s)');
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
async function start() {
  try {
    await redis.ping();
    console.log('[match-service] Redis connected');

    startLiveMatchesJob();

    app.listen(PORT, () => {
      console.log(`[match-service] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[match-service] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
