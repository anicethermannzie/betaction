require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const redis = require('./config/redis');
const apiFootballService = require('./services/apiFootballService');

const PORT = process.env.PORT || 3002;
const LIVE_CACHE_KEY = 'cache:/matches/live';
const LIVE_CACHE_TTL = 30; // seconds

const { CLUB_LEAGUES, INTERNATIONAL_COMPETITIONS } = require('./config/leagues');

const CLUB_LEAGUE_IDS = new Set(CLUB_LEAGUES.map(l => l.id));
const INTERNATIONAL_COMPETITION_IDS = new Set(INTERNATIONAL_COMPETITIONS.map(l => l.id));

const CLUB_TODAY_CACHE_KEY = 'matches:club:today';
const INTERNATIONAL_TODAY_CACHE_KEY = 'matches:international:today';
const TODAY_CACHE_TTL = 5 * 60; // 5 minutes

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

/**
 * Refresh today's club and international matches cache.
 */
async function refreshTodayMatchesCache() {
  try {
    const data = await apiFootballService.fetchTodayMatches();
    const clubMatches = [];
    const internationalMatches = [];

    if (data && data.response) {
      for (const match of data.response) {
        const leagueId = match.league?.id;
        if (CLUB_LEAGUE_IDS.has(leagueId)) {
          match.competition_type = 'club';
          clubMatches.push(match);
        } else if (INTERNATIONAL_COMPETITION_IDS.has(leagueId)) {
          match.competition_type = 'international';
          internationalMatches.push(match);
        }
      }
    }

    await redis.setex(CLUB_TODAY_CACHE_KEY, TODAY_CACHE_TTL, JSON.stringify({ success: true, response: clubMatches, results: clubMatches.length }));
    await redis.setex(INTERNATIONAL_TODAY_CACHE_KEY, TODAY_CACHE_TTL, JSON.stringify({ success: true, response: internationalMatches, results: internationalMatches.length }));
    console.log('[match-service] Today\'s club and international matches caches refreshed successfully');
  } catch (err) {
    console.error('[match-service] Today\'s matches cache refresh failed:', err.message);
  }
}

function startTodayMatchesJob() {
  cron.schedule('*/5 * * * *', refreshTodayMatchesCache);
  console.log('[match-service] Today\'s matches refresh job scheduled (every 5m)');
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
async function start() {
  try {
    await redis.ping();
    console.log('[match-service] Redis connected');

    startLiveMatchesJob();
    startTodayMatchesJob();

    // Warm up the caches immediately on startup
    refreshTodayMatchesCache();

    app.listen(PORT, () => {
      console.log(`[match-service] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[match-service] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
