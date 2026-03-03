'use strict';

const express      = require('express');
const { createServer } = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const helmet       = require('helmet');

const notificationRoutes = require('./routes/notificationRoutes');
const logger = require('./utils/logger');

// ── Express ───────────────────────────────────────────────────────────────────

const app = express();

// Helmet is safe to use alongside Socket.io (HTTP layer only)
app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// ── HTTP server (shared by Express + Socket.io) ───────────────────────────────

const httpServer = createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Prefer WebSocket, fall back to long-polling for proxied environments
  transports: ['websocket', 'polling'],
  // How long to wait (ms) before considering a client disconnected
  pingTimeout: 60_000,
  // How often (ms) to send a keep-alive ping
  pingInterval: 25_000,
  // Maximum number of reconnection retries on the client side (advisory)
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

// ── Inject io into every request so controllers can emit ─────────────────────

app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ── REST routes ───────────────────────────────────────────────────────────────

app.use('/', notificationRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Unhandled Express error', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = { app, httpServer, io };
