const cron = require('node-cron');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const apiFootballService = require('../services/apiFootballService');
const cacheKeys = require('../utils/cacheKeys');
const { cache } = require('../middleware/cacheMiddleware');
const { CLUB_LEAGUES, INTERNATIONAL_COMPETITIONS } = require('../config/leagues');

/**
 * This job used to warm matches:club:today / matches:international:today —
 * keys only GET /matches/clubs and GET /matches/international ever read.
 * GET /matches/date/:date (what the homepage actually calls) reads a
 * different key, cache:/matches/date/${date}, that this job never wrote to.
 * Both routes hit the exact same upstream endpoint (GET /fixtures?date=today)
 * with identical params, so every real page load past its own 5-minute TTL
 * fired a second, fully redundant upstream call this job's own fetch could
 * have served instead. Fix: one fetch now warms all three keys.
 */

const CLUB_TODAY_CACHE_KEY = 'matches:club:today';
const INTERNATIONAL_TODAY_CACHE_KEY = 'matches:international:today';
const TODAY_CACHE_TTL = cache.TTL.FIVE_MINUTES;

const CLUB_LEAGUE_IDS = new Set(CLUB_LEAGUES.map((l) => l.id));
const INTERNATIONAL_COMPETITION_IDS = new Set(INTERNATIONAL_COMPETITIONS.map((l) => l.id));

const todayDate = () => new Date().toISOString().split('T')[0];

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

    const clubPayload = { success: true, response: clubMatches, results: clubMatches.length };
    const internationalPayload = {
      success: true,
      response: internationalMatches,
      results: internationalMatches.length,
    };
    // Same shape matchController.getMatchesByDate returns on a live call —
    // that's what makes this safe to serve straight from cache.
    const byDatePayload = { success: true, club: clubMatches, international: internationalMatches };

    await Promise.all([
      redis.setex(CLUB_TODAY_CACHE_KEY, TODAY_CACHE_TTL, JSON.stringify(clubPayload)),
      redis.setex(INTERNATIONAL_TODAY_CACHE_KEY, TODAY_CACHE_TTL, JSON.stringify(internationalPayload)),
      redis.setex(cacheKeys.matchesByDate(todayDate()), TODAY_CACHE_TTL, JSON.stringify(byDatePayload)),
    ]);

    logger.info("Today's matches caches refreshed", {
      club: clubMatches.length,
      international: internationalMatches.length,
    });
  } catch (err) {
    logger.error("Today's matches cache refresh failed", { error: err.message });
  }
}

function startTodayMatchesJob() {
  if (process.env.ENABLE_TODAY_MATCHES_CRON === 'false') {
    logger.info("Today's matches cron disabled (ENABLE_TODAY_MATCHES_CRON=false)");
    return;
  }

  cron.schedule('*/5 * * * *', refreshTodayMatchesCache);
  logger.info("Today's matches refresh job scheduled", { interval: '5m' });

  // Warm the cache immediately so the first request after boot doesn't miss.
  refreshTodayMatchesCache();
}

module.exports = { startTodayMatchesJob, refreshTodayMatchesCache };
