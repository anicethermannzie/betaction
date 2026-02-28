const { Router } = require('express');
const matchController = require('../controllers/matchController');
const { cache } = require('../middleware/cacheMiddleware');

const router = Router();

// ── Health check ─────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'match-service',
    timestamp: new Date().toISOString(),
  });
});

// ── Match routes ──────────────────────────────────────────────────────────────
// IMPORTANT: specific paths (/live, /h2h, /date) must be declared
// BEFORE the parameterised /matches/:id route to avoid Express swallowing them.

// GET /matches/live  — cache 30 seconds (live data, refreshed by cron)
router.get('/matches/live', cache(cache.TTL.LIVE), matchController.getLiveMatches);

// GET /matches/h2h/:team1Id/:team2Id  — cache 24 hours
router.get('/matches/h2h/:team1Id/:team2Id', cache(cache.TTL.ONE_DAY), matchController.getHeadToHead);

// GET /matches/date/:date  — cache 5 minutes
router.get('/matches/date/:date', cache(cache.TTL.FIVE_MINUTES), matchController.getMatchesByDate);

// GET /matches/:id  — cache 1 minute
router.get('/matches/:id', cache(cache.TTL.ONE_MINUTE), matchController.getMatchById);

// GET /matches/:id/odds  — cache 5 minutes
router.get('/matches/:id/odds', cache(cache.TTL.FIVE_MINUTES), matchController.getMatchOdds);

// GET /matches/:id/statistics  — cache 5 minutes
router.get('/matches/:id/statistics', cache(cache.TTL.FIVE_MINUTES), matchController.getMatchStatistics);

// ── League routes ─────────────────────────────────────────────────────────────

// GET /leagues/:leagueId/standings?season=YYYY  — cache 1 hour
router.get('/leagues/:leagueId/standings', cache(cache.TTL.ONE_HOUR), matchController.getStandings);

// ── Team routes ───────────────────────────────────────────────────────────────

// GET /teams/:teamId/stats?league=ID&season=YYYY  — cache 1 hour
router.get('/teams/:teamId/stats', cache(cache.TTL.ONE_HOUR), matchController.getTeamStats);

module.exports = router;
