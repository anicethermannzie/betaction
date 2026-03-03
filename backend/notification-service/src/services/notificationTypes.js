'use strict';

/**
 * Centralised constants for all Socket.io event names, room name generators,
 * and Redis pub/sub channel names.
 *
 * Import from here throughout the service so event names never drift apart.
 */

// ── Socket.io events: Client → Server ────────────────────────────────────────

const CLIENT_EVENTS = {
  SUBSCRIBE_MATCH:        'subscribe:match',        // { matchId }
  UNSUBSCRIBE_MATCH:      'unsubscribe:match',      // { matchId }
  SUBSCRIBE_LEAGUE:       'subscribe:league',       // { leagueId }
  UNSUBSCRIBE_LEAGUE:     'unsubscribe:league',     // { leagueId }
  SUBSCRIBE_PREDICTIONS:  'subscribe:predictions',  // { matchId }
};

// ── Socket.io events: Server → Client ────────────────────────────────────────

const SERVER_EVENTS = {
  MATCH_STARTED:        'match:started',        // { matchId, homeTeam, awayTeam, league }
  MATCH_GOAL:           'match:goal',           // { matchId, team, scorer, minute, newScore }
  MATCH_HALFTIME:       'match:halftime',       // { matchId, score }
  MATCH_ENDED:          'match:ended',          // { matchId, finalScore }
  MATCH_REDCARD:        'match:redcard',        // { matchId, team, player, minute }
  PREDICTION_UPDATED:   'prediction:updated',   // { matchId, prediction }
  LIVE_SCORE:           'live:score',           // { matchId, score, minute, status }
};

// ── Room name generators ──────────────────────────────────────────────────────

const ROOMS = {
  /** One room per fixture — all clients watching that specific match. */
  match:       (matchId)   => `match:${matchId}`,
  /** One room per league  — clients watching any match in that league. */
  league:      (leagueId)  => `league:${leagueId}`,
  /** One room per fixture for prediction subscribers. */
  predictions: (matchId)   => `predictions:${matchId}`,
};

// ── Redis pub/sub channels ────────────────────────────────────────────────────

const REDIS_CHANNELS = {
  /** Inter-service channel. Other services publish events here. */
  NOTIFICATIONS: 'betaction:notifications',
};

// ── API-Football match status codes ──────────────────────────────────────────

const MATCH_STATUS = {
  LIVE:          ['1H', '2H', 'ET', 'BT', 'P', 'LIVE'],
  HALFTIME:      ['HT'],
  FINISHED:      ['FT', 'AET', 'PEN'],
  NOT_STARTED:   ['NS', 'TBD'],
  POSTPONED:     ['PST', 'CANC', 'ABD', 'AWD', 'WO'],
};

module.exports = { CLIENT_EVENTS, SERVER_EVENTS, ROOMS, REDIS_CHANNELS, MATCH_STATUS };
