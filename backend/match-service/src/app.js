const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const matchRoutes = require('./routes/matchRoutes');

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// ── Rate limiting: 100 requests / 15 min per IP ──────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/', matchRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[match-service] Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
