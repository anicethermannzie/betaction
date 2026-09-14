const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const billingRoutes = require('./routes/billingRoutes');
const billingController = require('./controllers/billingController');
const logger = require('./utils/logger');

const app = express();

// ── Proxy awareness ──────────────────────────────────────────────────────────
// The service only ever receives connections from the nginx gateway, so req.ip
// was resolving to the gateway's address for every request. That made the rate
// limiter below a single global bucket shared by the entire user base (~7
// requests/minute for everyone combined) and made its brute-force protection
// meaningless. Trusting exactly one hop restores the real client IP from
// X-Forwarded-For without letting a client forge it — nginx overwrites the
// header it appends to.
app.set('trust proxy', 1);

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// ── Rate limiting ────────────────────────────────────────────────────────────
// Baseline for the whole service, per client IP.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Credential endpoints get a far tighter budget: 10 attempts per 15 minutes per
// IP. Successful logins are not counted, so a legitimate user who signs in on
// several devices is unaffected while online guessing is throttled to a crawl.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait 15 minutes and try again.' },
});

// ── Stripe webhook (raw body) ─────────────────────────────────────────────────
// Registered ahead of the global express.json() below: Stripe's signature
// covers the exact request bytes, so this route must read the body as a raw
// Buffer via express.raw() before anything JSON-parses (and thereby mutates)
// it. Express runs middleware/routes in registration order, and this handler
// always ends the response itself, so requests to this exact path never reach
// express.json() below it.
app.post(
  '/api/auth/billing/webhook',
  express.raw({ type: 'application/json', limit: '1mb' }),
  billingController.webhook
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth/login', credentialLimiter);
app.use('/api/auth/register', credentialLimiter);
app.use('/api/auth', authRoutes);
// Bearer-token-authenticated billing endpoints (create-checkout-session,
// create-portal-session, status). Deliberately NOT nested under authRoutes:
// that router's CSRF guard (utils/sessionCookie.protect) exists for the
// cookie-based session flow login/refresh/logout rely on, which these routes
// do not use — a Bearer token is never sent automatically by a browser the
// way a cookie is, so the cross-site-request-forgery it guards against does
// not apply here. authenticate() (in billingRoutes.js) is the real guard.
app.use('/api/auth/billing', billingRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
// err.message can carry driver internals (connection strings, constraint names),
// so it is logged but never returned to the client.
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, path: req.originalUrl, stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.expose ? err.message : 'Request failed',
  });
});

module.exports = app;
