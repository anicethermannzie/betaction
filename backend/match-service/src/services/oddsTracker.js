'use strict';

const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Live odds movement tracking.
 *
 * API-Football's /odds endpoint returns only the current snapshot — no
 * history, no trend. To show movement (the ▲/▼ SofaScore-style indicators),
 * this service keeps its own short history in Redis and diffs the latest
 * fetch against the previous one.
 *
 * Stored as a single JSON array (not a Redis LIST) under one key, capped at
 * MAX_SNAPSHOTS — the shared redis wrapper (config/redis.js) only exposes
 * get/setex, and 20 small objects is not worth adding list commands (with
 * their own in-memory-fallback semantics) for. Read-modify-write is not
 * atomic, so two concurrent requests for the same fixture could each read the
 * same prior state and both append — worst case one snapshot is dropped from
 * the history, which only blunts one movement comparison, never corrupts one.
 */

const MAX_SNAPSHOTS = 20;
const historyKey = (fixtureId) => `odds_history:${fixtureId}`;

/**
 * Append a snapshot and return the movement of each outcome vs. the
 * immediately preceding snapshot.
 *
 * @param {string|number} fixtureId
 * @param {{ home_odds: number, draw_odds: number, away_odds: number }} currentOdds
 * @returns {Promise<{ home: 'up'|'down'|'stable', draw: 'up'|'down'|'stable', away: 'up'|'down'|'stable' }>}
 */
async function trackOddsSnapshot(fixtureId, currentOdds) {
  const key = historyKey(fixtureId);

  let history = [];
  try {
    const raw = await redis.get(key);
    if (raw) history = JSON.parse(raw);
  } catch (err) {
    logger.warn('Failed to read odds history, starting fresh', { error: err.message, fixtureId });
    history = [];
  }

  const previous = history[history.length - 1] ?? null;

  const snapshot = {
    timestamp: new Date().toISOString(),
    home_odds: toFiniteNumber(currentOdds.home_odds),
    draw_odds: toFiniteNumber(currentOdds.draw_odds),
    away_odds: toFiniteNumber(currentOdds.away_odds),
  };

  history.push(snapshot);
  if (history.length > MAX_SNAPSHOTS) {
    history = history.slice(history.length - MAX_SNAPSHOTS);
  }

  try {
    // A day's worth is plenty of headroom — this is a rolling window keyed by
    // fixture, not a permanent record, and finished fixtures naturally stop
    // being fetched (and so stop being extended) long before this expires.
    await redis.setex(key, 24 * 60 * 60, JSON.stringify(history));
  } catch (err) {
    logger.error('Failed to persist odds snapshot', { error: err.message, fixtureId });
  }

  return {
    home: movement(previous?.home_odds, snapshot.home_odds),
    draw: movement(previous?.draw_odds, snapshot.draw_odds),
    away: movement(previous?.away_odds, snapshot.away_odds),
  };
}

/**
 * "up" = odds increased = the market now rates that outcome LESS likely.
 * "down" = odds decreased = the market now rates it MORE likely.
 */
function movement(previous, current) {
  if (previous === null || previous === undefined || !Number.isFinite(previous)) return 'stable';
  if (!Number.isFinite(current)) return 'stable';
  // A fixed threshold rather than any change at all: odds APIs frequently
  // re-report the exact same price with float noise in the 4th decimal,
  // which would otherwise flicker the arrows on every poll.
  const delta = current - previous;
  if (Math.abs(delta) < 0.01) return 'stable';
  return delta > 0 ? 'up' : 'down';
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

module.exports = { trackOddsSnapshot };
