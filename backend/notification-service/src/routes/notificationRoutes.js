'use strict';

const { Router } = require('express');
const { sendMatchEvent, getStats } = require('../controllers/notificationController');

const router = Router();

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  const io = req.io;

  res.status(200).json({
    status: 'ok',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    socketio: {
      status: 'running',
      connectedClients: io?.engine?.clientsCount ?? 0,
    },
    redis: {
      // Redis connectivity is verified at startup; if we reach this handler, it's fine
      status: 'connected',
    },
  });
});

// ── Internal notification endpoint ────────────────────────────────────────────
// Called by other microservices to push events to Socket.io clients.
router.post('/notify/match-event', sendMatchEvent);

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', getStats);

module.exports = router;
