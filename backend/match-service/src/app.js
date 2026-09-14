const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const matchRoutes = require('./routes/matchRoutes');
const logger = require('./utils/logger');

const app = express();

// ── Proxy awareness ──────────────────────────────────────────────────────────
// Requests arrive only from the nginx gateway, so req.ip was the gateway's
// address for every caller. That turned the limiter below into one global bucket
// shared by the entire user base — roughly 7 requests per minute for everyone
// combined, after which every customer got a 429. Trusting exactly one hop
// restores the real client IP without letting a client forge it.
app.set('trust proxy', 1);

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// ── Rate limiting: 100 requests / 15 min per client IP ───────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  // Health checks come from the container runtime and must never be throttled.
  skip: (req) => req.path === '/health',
});
app.use(limiter);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/', matchRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
// err.message can carry upstream URLs and driver internals, so it is logged but
// never returned to the client.
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, path: req.originalUrl, stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : 'Request failed',
  });
});

module.exports = app;
