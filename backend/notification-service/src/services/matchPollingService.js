'use strict';

/**
 * Match polling service.
 *
 * Every 30 seconds:
 *   1. Fetch all live fixtures from match-service (GET /matches/live).
 *   2. Load the previous state for each fixture from Redis.
 *   3. Diff current vs previous state.
 *   4. Emit the appropriate Socket.io events to match + league rooms.
 *   5. Persist the new state back to Redis.
 *
 * Redis key per match: "poll:match:<fixtureId>"  (TTL 2 hours)
 * This approach is horizontally scalable: multiple instances of the
 * notification-service will all poll, but emit to the same Redis-backed
 * Socket.io adapter rooms.
 */

const cron  = require('node-cron');
const axios = require('axios');
const { redis } = require('../config/redis');
const { SERVER_EVENTS, MATCH_STATUS } = require('./notificationTypes');
const { emitToMatchRoom, emitToLeagueRoom } = require('./socketService');
const logger = require('../utils/logger');

const MATCH_SERVICE_URL = process.env.MATCH_SERVICE_URL || 'http://localhost:3002';
const STATE_KEY = (matchId) => `poll:match:${matchId}`;
const STATE_TTL = 7200; // 2 hours in seconds

// ── State helpers ─────────────────────────────────────────────────────────────

async function loadState(matchId) {
  try {
    const raw = await redis.get(STATE_KEY(matchId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.error('Failed to load match state from Redis', { matchId, error: err.message });
    return null;
  }
}

async function saveState(matchId, state) {
  try {
    await redis.setex(STATE_KEY(matchId), STATE_TTL, JSON.stringify(state));
  } catch (err) {
    logger.error('Failed to save match state to Redis', { matchId, error: err.message });
  }
}

// ── Fixture data extraction ───────────────────────────────────────────────────

function extractState(fixture) {
  return {
    matchId:    fixture.fixture.id,
    homeTeamId: fixture.teams.home.id,
    homeTeam:   fixture.teams.home.name,
    awayTeamId: fixture.teams.away.id,
    awayTeam:   fixture.teams.away.name,
    leagueId:   fixture.league.id,
    leagueName: fixture.league.name,
    status:     fixture.fixture.status.short,   // '1H', 'HT', '2H', 'FT', …
    elapsed:    fixture.fixture.status.elapsed ?? 0,
    homeGoals:  fixture.goals.home  ?? 0,
    awayGoals:  fixture.goals.away  ?? 0,
    // Capture event list length so we know where new events start next tick
    eventCount: (fixture.events ?? []).length,
    events:     fixture.events ?? [],
  };
}

// ── Event detectors ───────────────────────────────────────────────────────────

function detectGoal(io, current, prev) {
  if (current.homeGoals === prev.homeGoals && current.awayGoals === prev.awayGoals) return;

  // Try to find the goal event in the new events slice
  const newEvents = current.events.slice(prev.eventCount);
  const goalEvent = newEvents.find((e) => e.type === 'Goal' && e.detail !== 'Missed Penalty');

  const scoringTeam =
    goalEvent?.team?.name ??
    (current.homeGoals > prev.homeGoals ? current.homeTeam : current.awayTeam);

  const payload = {
    matchId:  current.matchId,
    team:     scoringTeam,
    scorer:   goalEvent?.player?.name ?? 'Unknown',
    minute:   goalEvent?.time?.elapsed ?? current.elapsed,
    newScore: { home: current.homeGoals, away: current.awayGoals },
  };

  emitToMatchRoom(io, current.matchId, SERVER_EVENTS.MATCH_GOAL, payload);
  emitToLeagueRoom(io, current.leagueId, SERVER_EVENTS.MATCH_GOAL, payload);

  logger.info('Goal event emitted', {
    matchId: current.matchId,
    scorer: payload.scorer,
    minute: payload.minute,
    score: `${current.homeGoals}-${current.awayGoals}`,
  });
}

function detectRedCard(io, current, prev) {
  const newEvents = current.events.slice(prev.eventCount);
  const redCard = newEvents.find(
    (e) => e.type === 'Card' && e.detail === 'Red Card'
  );
  if (!redCard) return;

  const payload = {
    matchId: current.matchId,
    team:    redCard.team?.name ?? 'Unknown',
    player:  redCard.player?.name ?? 'Unknown',
    minute:  redCard.time?.elapsed ?? current.elapsed,
  };

  emitToMatchRoom(io, current.matchId, SERVER_EVENTS.MATCH_REDCARD, payload);
  logger.info('Red card event emitted', { matchId: current.matchId, player: payload.player });
}

function detectStatusChange(io, current, prev) {
  if (current.status === prev.status) return;

  const { matchId, homeTeam, awayTeam, leagueName, leagueId, homeGoals, awayGoals, elapsed } = current;

  if (MATCH_STATUS.HALFTIME.includes(current.status)) {
    const payload = { matchId, score: { home: homeGoals, away: awayGoals } };
    emitToMatchRoom(io, matchId, SERVER_EVENTS.MATCH_HALFTIME, payload);
    logger.info('Half-time event emitted', { matchId });
    return;
  }

  if (MATCH_STATUS.FINISHED.includes(current.status)) {
    const payload = { matchId, finalScore: { home: homeGoals, away: awayGoals } };
    emitToMatchRoom(io, matchId, SERVER_EVENTS.MATCH_ENDED, payload);
    emitToLeagueRoom(io, leagueId, SERVER_EVENTS.MATCH_ENDED, payload);
    logger.info('Match ended event emitted', { matchId, finalScore: payload.finalScore });
  }
}

// ── Per-fixture processing ────────────────────────────────────────────────────

async function processFixture(io, fixture) {
  const current = extractState(fixture);
  const { matchId, leagueId, homeTeam, awayTeam, leagueName } = current;

  const prev = await loadState(matchId);

  if (!prev) {
    // First time we see this fixture live — announce match start
    if (MATCH_STATUS.LIVE.includes(current.status)) {
      const payload = { matchId, homeTeam, awayTeam, league: leagueName };
      emitToMatchRoom(io, matchId, SERVER_EVENTS.MATCH_STARTED, payload);
      emitToLeagueRoom(io, leagueId, SERVER_EVENTS.MATCH_STARTED, payload);
      logger.info('Match started event emitted', { matchId, homeTeam, awayTeam });
    }
    await saveState(matchId, current);
    return;
  }

  // Run all diffing checks
  detectGoal(io, current, prev);
  detectRedCard(io, current, prev);
  detectStatusChange(io, current, prev);

  // Always broadcast live score heartbeat so clients can update the clock
  emitToMatchRoom(io, matchId, SERVER_EVENTS.LIVE_SCORE, {
    matchId,
    score:   { home: current.homeGoals, away: current.awayGoals },
    minute:  current.elapsed,
    status:  current.status,
  });

  await saveState(matchId, current);
}

// ── Poll loop ─────────────────────────────────────────────────────────────────

async function pollOnce(io) {
  logger.debug('Polling live matches from match-service');

  let fixtures;
  try {
    const { data } = await axios.get(`${MATCH_SERVICE_URL}/matches/live`, {
      timeout: 8000,
    });
    fixtures = data?.response ?? [];
  } catch (err) {
    logger.error('Live match poll failed', {
      url: `${MATCH_SERVICE_URL}/matches/live`,
      error: err.message,
    });
    return;
  }

  if (!fixtures.length) {
    logger.debug('No live matches at this tick');
    return;
  }

  logger.info('Processing live fixtures', { count: fixtures.length });

  // Process each fixture independently — one failure doesn't stop the rest
  await Promise.allSettled(
    fixtures.map((fx) => processFixture(io, fx))
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

function startMatchPolling(io) {
  // Schedule poll every 30 seconds
  cron.schedule('*/30 * * * * *', () => pollOnce(io));
  logger.info('Match polling scheduled', { interval: '30s' });

  // Run an immediate first poll so the service is useful from the first second
  pollOnce(io);
}

module.exports = { startMatchPolling, pollOnce };
