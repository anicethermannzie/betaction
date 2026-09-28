const { Router } = require('express');
const matchController = require('../controllers/matchController');
const { cache } = require('../middleware/cacheMiddleware');
const cacheKeys = require('../utils/cacheKeys');

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
//
// Each route passes its cache key builder to the middleware. The builders live in
// utils/cacheKeys.js so that cron jobs and admin scripts invalidate the exact
// same keys the request path writes.

const today = () => new Date().toISOString().split('T')[0];

// GET /matches/live  — cache 30 seconds (live data, refreshed by cron)
// Stale serving is disabled here: an hours-old scoreline presented as live would
// mislead in a way that a 502 does not.
router.get(
  '/matches/live',
  cache(cache.TTL.LIVE, cacheKeys.liveMatches, { staleTtl: 0 }),
  matchController.getLiveMatches
);

// GET /matches/h2h/:team1Id/:team2Id  — cache 24 hours
// Key is order-independent: h2h/33/40 and h2h/40/33 share one entry.
router.get(
  '/matches/h2h/:team1Id/:team2Id',
  cache(cache.TTL.ONE_DAY, (req) => cacheKeys.headToHead(req.params.team1Id, req.params.team2Id)),
  matchController.getHeadToHead
);

// GET /matches/international  — cache 5 minutes
router.get(
  '/matches/international',
  cache(cache.TTL.FIVE_MINUTES, () => 'matches:international:today'),
  matchController.getInternationalMatches
);

// GET /matches/international/:date  — cache 5 minutes
// Shares the cron-warmed key when the date requested is today.
router.get(
  '/matches/international/:date',
  cache(cache.TTL.FIVE_MINUTES, (req) =>
    req.params.date === today()
      ? 'matches:international:today'
      : `cache:/matches/international/${req.params.date}`
  ),
  matchController.getInternationalMatches
);

// GET /matches/clubs  — cache 5 minutes
router.get(
  '/matches/clubs',
  cache(cache.TTL.FIVE_MINUTES, () => 'matches:club:today'),
  matchController.getClubMatches
);

// GET /matches/clubs/:date  — cache 5 minutes
router.get(
  '/matches/clubs/:date',
  cache(cache.TTL.FIVE_MINUTES, (req) =>
    req.params.date === today()
      ? 'matches:club:today'
      : `cache:/matches/clubs/${req.params.date}`
  ),
  matchController.getClubMatches
);

// GET /matches/date/:date  — cache 5 minutes
router.get(
  '/matches/date/:date',
  cache(cache.TTL.FIVE_MINUTES, (req) => cacheKeys.matchesByDate(req.params.date)),
  matchController.getMatchesByDate
);

// GET /matches/:id  — cache 1 minute
router.get(
  '/matches/:id',
  cache(cache.TTL.ONE_MINUTE, (req) => cacheKeys.matchById(req.params.id)),
  matchController.getMatchById
);

// GET /matches/:id/odds  — cache 5 minutes
router.get(
  '/matches/:id/odds',
  cache(cache.TTL.FIVE_MINUTES, (req) => cacheKeys.matchOdds(req.params.id)),
  matchController.getMatchOdds
);

// GET /matches/:id/statistics  — cache 5 minutes
router.get(
  '/matches/:id/statistics',
  cache(cache.TTL.FIVE_MINUTES, (req) => cacheKeys.matchStatistics(req.params.id)),
  matchController.getMatchStatistics
);

// Live-aware TTL: the caller passes ?live=true when it already knows the
// fixture is in progress (it fetched the fixture itself first, same as every
// other page on this site does). A finished match's events/momentum never
// change again, so there is no reason to hold them to a 30-second TTL forever
// — but computing "is this fixture still live" server-side would cost a
// second upstream call just to pick a cache duration, which defeats the point
// of caching in the first place.
const liveAwareTtl = (req) =>
  req.query.live === 'true' ? cache.TTL.LIVE : cache.TTL.ONE_HOUR;

// GET /matches/:id/events  — cache 30s live / 1h otherwise
router.get(
  '/matches/:id/events',
  cache(liveAwareTtl, (req) => cacheKeys.matchEvents(req.params.id)),
  matchController.getMatchEvents
);

// GET /matches/:id/momentum  — cache 30s live / 1h otherwise
router.get(
  '/matches/:id/momentum',
  cache(liveAwareTtl, (req) => cacheKeys.matchMomentum(req.params.id)),
  matchController.getMatchMomentum
);

// GET /matches/:id/odds/live  — cache 15s live / 5 minutes otherwise
router.get(
  '/matches/:id/odds/live',
  cache(
    (req) => (req.query.live === 'true' ? 15 : cache.TTL.FIVE_MINUTES),
    (req) => cacheKeys.matchLiveOdds(req.params.id)
  ),
  matchController.getLiveOdds
);

// ── League routes ─────────────────────────────────────────────────────────────

// GET /leagues  — cache 1 hour
router.get('/leagues', cache(cache.TTL.ONE_HOUR), matchController.getLeagues);

// GET /leagues/international  — cache 1 hour
router.get('/leagues/international', cache(cache.TTL.ONE_HOUR), matchController.getInternationalLeagues);

// GET /leagues/clubs  — cache 1 hour
router.get('/leagues/clubs', cache(cache.TTL.ONE_HOUR), matchController.getClubLeagues);

// GET /leagues/:leagueId/standings?season=YYYY  — cache 1 hour
// Season is part of the key so tables do not collide year-on-year.
router.get(
  '/leagues/:leagueId/standings',
  cache(cache.TTL.ONE_HOUR, (req) =>
    cacheKeys.standings(req.params.leagueId, req.query.season || new Date().getFullYear())
  ),
  matchController.getStandings
);

// ── Team routes ───────────────────────────────────────────────────────────────

// GET /teams/:teamId/stats?league=ID&season=YYYY  — cache 1 hour
router.get(
  '/teams/:teamId/stats',
  cache(cache.TTL.ONE_HOUR, (req) =>
    cacheKeys.teamStats(
      req.params.teamId,
      req.query.league,
      req.query.season || new Date().getFullYear()
    )
  ),
  matchController.getTeamStats
);

module.exports = router;
