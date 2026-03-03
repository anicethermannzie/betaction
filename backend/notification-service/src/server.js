'use strict';

require('dotenv').config();

const { httpServer, io } = require('./app');
const { redis, subscriber } = require('./config/redis');
const { initSocketService, emitToPredictionsRoom, emitToMatchRoom, emitToLeagueRoom } = require('./services/socketService');
const { startMatchPolling } = require('./services/matchPollingService');
const { REDIS_CHANNELS, SERVER_EVENTS } = require('./services/notificationTypes');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 3003;

// ── Redis pub/sub message handler ─────────────────────────────────────────────

/**
 * Handles messages published to the "betaction:notifications" Redis channel
 * by other services (primarily prediction-service).
 *
 * Expected message shapes:
 *   { type: "prediction:updated", matchId, data: { ... } }
 *   { type: "match:event", matchId, leagueId, event: "match:goal", data: { ... } }
 */
function handleRedisMessage(channel, raw) {
  if (channel !== REDIS_CHANNELS.NOTIFICATIONS) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    logger.error('Invalid JSON on Redis channel', { channel, raw, error: err.message });
    return;
  }

  const { type, matchId, leagueId, data = {} } = payload;

  if (!type || !matchId) {
    logger.warn('Redis message missing required fields', { payload });
    return;
  }

  switch (type) {
    case 'prediction:updated':
      emitToPredictionsRoom(io, matchId, SERVER_EVENTS.PREDICTION_UPDATED, { matchId, prediction: data });
      logger.info('Prediction update forwarded to room', { matchId });
      break;

    case 'match:event': {
      // Generic escape hatch: another service can push any match event via Redis
      const { event, eventData = {} } = data;
      if (!event) break;
      emitToMatchRoom(io, matchId, event, { matchId, ...eventData });
      if (leagueId) {
        emitToLeagueRoom(io, leagueId, event, { matchId, ...eventData });
      }
      logger.info('Match event forwarded from Redis', { event, matchId, leagueId });
      break;
    }

    default:
      logger.debug('Unknown Redis notification type', { type, matchId });
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function start() {
  try {
    // 1. Verify general Redis connectivity
    await redis.ping();
    logger.info('Redis client ready');

    // 2. Subscribe to inter-service notification channel
    await subscriber.subscribe(REDIS_CHANNELS.NOTIFICATIONS);
    subscriber.on('message', handleRedisMessage);
    logger.info('Redis pub/sub active', { channel: REDIS_CHANNELS.NOTIFICATIONS });

    // 3. Wire up Socket.io authentication + event handlers
    initSocketService(io);

    // 4. Start live match polling cron (emits score/status change events)
    startMatchPolling(io);

    // 5. Bind HTTP + WebSocket server
    httpServer.listen(PORT, () => {
      logger.info('Notification service started', { port: PORT });
    });
  } catch (err) {
    logger.error('Fatal: failed to start notification service', { error: err.message });
    process.exit(1);
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function shutdown(signal) {
  logger.info('Shutdown signal received', { signal });
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

start();
