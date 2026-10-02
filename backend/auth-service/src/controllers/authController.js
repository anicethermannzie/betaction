const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const subscriptionModel = require('../models/subscriptionModel');
const { generateAccessToken } = require('../utils/jwt');
const sessions = require('../models/sessionModel');
const cookie = require('../utils/sessionCookie');
const { claimsFor } = require('../utils/entitlements');
const { getStripeClient } = require('../config/stripe');
const logger = require('../utils/logger');

const SALT_ROUNDS = 10;

/** Shape the user object returned to the client. Never leak password_hash. */
function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    plan: user.plan,
    trialEndsAt: user.trial_ends_at ?? null,
    createdAt: user.created_at,
  };
}

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userModel.create({ username, email, passwordHash });

    return res.status(201).json({
      message: 'Account created successfully',
      user: publicUser(user),
    });
  } catch (err) {
    // The unique index is the real guard against duplicate accounts; the check
    // above can lose a race between two concurrent signups.
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email or username already exists' });
    }
    logger.error('Registration failed', { error: err.message });
    return res.status(500).json({ error: 'Failed to create account' });
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      // Use a generic message to prevent email enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const session = await sessions.create(user.id);
    const accessToken = generateAccessToken({
      id: user.id, email: user.email, role: user.role, sid: session.id, ...claimsFor(user),
    });
    cookie.set(res, session);

    return res.status(200).json({
      message: 'Login successful',
      user: publicUser(user),
      accessToken,
    });
  } catch (err) {
    logger.error('Login failed', { error: err.message });
    return res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * POST /api/auth/refresh-token
 * Refresh credential is read only from the HttpOnly session cookie.
 */
async function refreshToken(req, res) {
  try {
    const session = await sessions.resolve(cookie.read(req), true);
    if (!session) { cookie.clear(res); return res.status(401).json({ error: 'Invalid session' }); }
    const user = await userModel.findById(session.user_id);
    if (!user) { cookie.clear(res); return res.status(401).json({ error: 'Invalid session' }); }
    cookie.set(res, session);
    // Re-read from the database rather than carrying claims forward, so a plan
    // change takes effect on the next refresh instead of the next login.
    return res.json({
      user: publicUser(user),
      accessToken: generateAccessToken({
        id: user.id, email: user.email, role: user.role, sid: session.id, ...claimsFor(user),
      }),
    });
  } catch (err) {
    logger.error('Refresh failed', { error: err.message });
    return res.status(503).json({ error: 'Session service unavailable' });
  }
}

async function session(req, res) {
  try { return res.sendStatus(await sessions.resolve(cookie.read(req)) ? 204 : 401); }
  catch (err) { logger.error('Session check failed', { error: err.message }); return res.sendStatus(503); }
}

async function logout(req, res) {
  try {
    await sessions.revoke(cookie.read(req));
    cookie.clear(res);
    return res.sendStatus(204);
  } catch (err) {
    logger.error('Logout failed', { error: err.message });
    return res.status(503).json({ error: 'Logout failed; please retry' });
  }
}

/**
 * GET /api/auth/profile
 * Requires: Authorization: Bearer <accessToken>
 */
async function getProfile(req, res) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user: publicUser(user) });
  } catch (err) {
    logger.error('Profile lookup failed', { error: err.message });
    return res.status(500).json({ error: 'Could not retrieve profile' });
  }
}

/**
 * DELETE /api/auth/account
 * Body: { password }
 * Requires: Authorization: Bearer <accessToken>
 *
 * Permanently deletes the account. Order matters: any live Stripe
 * subscription is canceled BEFORE the user row is deleted, not after. If the
 * Stripe cancel call fails, the account is left intact and the delete fails —
 * the alternative (delete first) risks an orphaned Stripe subscription that
 * keeps charging a card with no account left to manage or cancel it from.
 */
async function deleteAccount(req, res) {
  try {
    const { password } = req.body;

    // req.user comes from the JWT, which does not carry password_hash — look
    // the row up fresh so the comparison is against the current hash, not a
    // stale claim from whenever the token was issued.
    const user = await userModel.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const activeSubscriptionId = await subscriptionModel.findActiveStripeSubscriptionId(user.id);
    if (activeSubscriptionId) {
      try {
        const stripe = getStripeClient();
        await stripe.subscriptions.cancel(activeSubscriptionId);
      } catch (err) {
        logger.error('Failed to cancel Stripe subscription before account deletion', {
          error: err.message, userId: user.id, stripeSubscriptionId: activeSubscriptionId,
        });
        return res.status(502).json({
          error: 'Could not cancel your active subscription. Please try again, or manage your subscription first.',
        });
      }
    }

    await userModel.remove(user.id);
    cookie.clear(res);
    return res.sendStatus(204);
  } catch (err) {
    logger.error('Account deletion failed', { error: err.message, userId: req.user?.id });
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}

module.exports = { register, login, refreshToken, getProfile, session, logout, deleteAccount };
