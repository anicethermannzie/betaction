require('dotenv').config();
const cron = require('node-cron');
const logger = require('./utils/logger');
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
      logger.debug('Live matches cache refreshed');
    } catch (err) {
      logger.error('Live matches cache refresh failed', { error: err.message });
    }
  });
  logger.info('Live matches refresh job scheduled', { interval: '30s' });
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
    logger.info('Today\'s matches caches refreshed', {
      club: clubMatches.length,
      international: internationalMatches.length,
    });
  } catch (err) {
    logger.error('Today\'s matches cache refresh failed', { error: err.message });
  }
}

function startTodayMatchesJob() {
  cron.schedule('*/5 * * * *', refreshTodayMatchesCache);
  logger.info('Today\'s matches refresh job scheduled', { interval: '5m' });
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
async function start() {
  try {
    await redis.ping();
    logger.info('Redis connected');

    startLiveMatchesJob();
    startTodayMatchesJob();

    // Warm up the caches immediately on startup
    refreshTodayMatchesCache();

    app.listen(PORT, () => {
      logger.info('Listening', { port: PORT });
    });
  } catch (err) {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  }
}

start();
