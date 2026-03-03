'use strict';

const jwt = require('jsonwebtoken');
const { CLIENT_EVENTS, SERVER_EVENTS, ROOMS } = require('./notificationTypes');
const logger = require('../utils/logger');

// ── JWT authentication middleware ─────────────────────────────────────────────

/**
 * Socket.io middleware applied to every incoming connection.
 *
 * Token can be supplied in two ways (client's choice):
 *   1. socket.handshake.auth.token
 *   2. Authorization: Bearer <token> header
 *
 * Strategy: unauthenticated clients are allowed to connect in read-only mode
 * (they can still receive match events). Authenticated clients get a `socket.user`
 * object attached, which can be used for future write-protected features.
 */
function authMiddleware(socket, next) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    socket.user = null; // anonymous — read-only
    return next();
  }

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug('Socket authenticated', { socketId: socket.id, userId: socket.user.id });
  } catch (err) {
    // Expired or invalid token — still allow connection as anonymous
    socket.user = null;
    logger.warn('Socket JWT verification failed', { socketId: socket.id, error: err.message });
  }

  next();
}

// ── Room helpers ──────────────────────────────────────────────────────────────

/**
 * Return the number of sockets currently in a Socket.io room.
 * Uses Socket.io's internal adapter state — always accurate regardless of
 * reconnections or abrupt disconnections.
 */
function roomSize(io, roomName) {
  return io.sockets.adapter.rooms.get(roomName)?.size ?? 0;
}

function joinRoom(socket, io, roomName, meta = {}) {
  socket.join(roomName);
  logger.info('Client joined room', {
    socketId: socket.id,
    userId: socket.user?.id ?? 'anonymous',
    room: roomName,
    roomSize: roomSize(io, roomName),
    ...meta,
  });
}

function leaveRoom(socket, io, roomName, meta = {}) {
  socket.leave(roomName);
  logger.info('Client left room', {
    socketId: socket.id,
    room: roomName,
    roomSize: roomSize(io, roomName),
    ...meta,
  });
}

// ── Event handler registration ────────────────────────────────────────────────

function registerClientEvents(socket, io) {
  // ── Match subscription ────────────────────────────────────────────────────
  socket.on(CLIENT_EVENTS.SUBSCRIBE_MATCH, ({ matchId } = {}) => {
    if (!matchId) return;
    joinRoom(socket, io, ROOMS.match(matchId), { matchId });
  });

  socket.on(CLIENT_EVENTS.UNSUBSCRIBE_MATCH, ({ matchId } = {}) => {
    if (!matchId) return;
    leaveRoom(socket, io, ROOMS.match(matchId), { matchId });
  });

  // ── League subscription ───────────────────────────────────────────────────
  socket.on(CLIENT_EVENTS.SUBSCRIBE_LEAGUE, ({ leagueId } = {}) => {
    if (!leagueId) return;
    joinRoom(socket, io, ROOMS.league(leagueId), { leagueId });
  });

  socket.on(CLIENT_EVENTS.UNSUBSCRIBE_LEAGUE, ({ leagueId } = {}) => {
    if (!leagueId) return;
    leaveRoom(socket, io, ROOMS.league(leagueId), { leagueId });
  });

  // ── Prediction subscription ───────────────────────────────────────────────
  socket.on(CLIENT_EVENTS.SUBSCRIBE_PREDICTIONS, ({ matchId } = {}) => {
    if (!matchId) return;
    joinRoom(socket, io, ROOMS.predictions(matchId), { matchId });
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    logger.info('Client disconnected', {
      socketId: socket.id,
      userId: socket.user?.id ?? 'anonymous',
      reason,
      totalConnected: io.engine.clientsCount,
    });
  });

  socket.on('error', (err) => {
    logger.error('Socket error', { socketId: socket.id, error: err.message });
  });
}

// ── Public init ───────────────────────────────────────────────────────────────

function initSocketService(io) {
  io.use(authMiddleware);

  io.on('connection', (socket) => {
    logger.info('Client connected', {
      socketId: socket.id,
      userId: socket.user?.id ?? 'anonymous',
      transport: socket.conn.transport.name,
      totalConnected: io.engine.clientsCount,
    });

    registerClientEvents(socket, io);
  });

  logger.info('Socket.io service initialised');
}

// ── Emit helpers (used by other services) ────────────────────────────────────

function emitToMatchRoom(io, matchId, event, data) {
  io.to(ROOMS.match(matchId)).emit(event, data);
}

function emitToLeagueRoom(io, leagueId, event, data) {
  io.to(ROOMS.league(leagueId)).emit(event, data);
}

function emitToPredictionsRoom(io, matchId, event, data) {
  io.to(ROOMS.predictions(matchId)).emit(event, data);
}

// ── Stats helper ──────────────────────────────────────────────────────────────

/**
 * Build a snapshot of active rooms and their client counts.
 * Excludes the per-socket default rooms (which share the socket's ID as name).
 */
function getRoomStats(io) {
  const rooms = {};
  for (const [roomName, sockets] of io.sockets.adapter.rooms) {
    // Each socket has a private room with its own ID — skip those
    if (io.sockets.sockets.has(roomName)) continue;
    rooms[roomName] = sockets.size;
  }
  return rooms;
}

module.exports = {
  initSocketService,
  emitToMatchRoom,
  emitToLeagueRoom,
  emitToPredictionsRoom,
  getRoomStats,
  roomSize,
};
