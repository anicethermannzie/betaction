'use strict';

const { emitToMatchRoom, emitToLeagueRoom, emitToPredictionsRoom, getRoomStats } = require('../services/socketService');
const { SERVER_EVENTS } = require('../services/notificationTypes');
const logger = require('../utils/logger');

// Whitelist of event types that external services may send via REST
const ALLOWED_EVENTS = new Set(Object.values(SERVER_EVENTS));

/**
 * POST /notify/match-event
 *
 * Internal endpoint — called by other microservices (e.g. prediction-service)
 * to push an event to connected Socket.io clients without needing a Redis
 * pub/sub connection.
 *
 * Body:
 *   {
 *     type:      string   — one of SERVER_EVENTS values
 *     matchId:   number   — fixture ID
 *     leagueId?: number   — if set, also emit to the league room
 *     data:      object   — event payload merged with { matchId }
 *   }
 */
async function sendMatchEvent(req, res) {
  const { type, matchId, leagueId, data = {} } = req.body;

  if (!type || !matchId) {
    return res.status(400).json({ error: '"type" and "matchId" are required' });
  }

  if (!ALLOWED_EVENTS.has(type)) {
    return res.status(400).json({
      error: `Unknown event type: "${type}"`,
      allowed: [...ALLOWED_EVENTS],
    });
  }

  try {
    const payload = { matchId, ...data };

    emitToMatchRoom(req.io, matchId, type, payload);

    if (leagueId) {
      emitToLeagueRoom(req.io, leagueId, type, payload);
    }

    // prediction:updated also targets the predictions room
    if (type === SERVER_EVENTS.PREDICTION_UPDATED) {
      emitToPredictionsRoom(req.io, matchId, type, payload);
    }

    logger.info('Match event sent via REST', { type, matchId, leagueId });

    return res.status(200).json({ success: true, event: type, matchId });
  } catch (err) {
    logger.error('Failed to send match event', { error: err.message, type, matchId });
    return res.status(500).json({ error: 'Failed to emit notification' });
  }
}

/**
 * GET /stats
 *
 * Returns a snapshot of the notification service's current state:
 * connected client count, active rooms and their sizes.
 */
function getStats(req, res) {
  try {
    const io = req.io;
    const rooms = getRoomStats(io);

    return res.status(200).json({
      success: true,
      data: {
        connectedClients: io.engine.clientsCount,
        activeRooms: Object.keys(rooms).length,
        rooms,
      },
    });
  } catch (err) {
    logger.error('Failed to retrieve stats', { error: err.message });
    return res.status(500).json({ error: 'Failed to retrieve stats' });
  }
}

module.exports = { sendMatchEvent, getStats };
