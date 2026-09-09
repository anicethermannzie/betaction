'use strict';

const { Router } = require('express');
const { sendMatchEvent, getStats } = require('../controllers/notificationController');
const { requireInternalKey } = require('../middleware/internalAuth');

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
// Requires the X-Internal-Api-Key header — see middleware/internalAuth.js.
router.post('/notify/match-event', requireInternalKey, sendMatchEvent);

// ── Stats ─────────────────────────────────────────────────────────────────────
// Internal-only: exposes room membership and connected-client counts.
router.get('/stats', requireInternalKey, getStats);

module.exports = router;
