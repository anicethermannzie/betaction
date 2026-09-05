const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { generateAccessToken } = require('../utils/jwt');
const sessions = require('../models/sessionModel');
const cookie = require('../utils/sessionCookie');

const SALT_ROUNDS = 10;

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
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('[authController.register]', err);
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
    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, sid: session.id });
    cookie.set(res, session);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (err) {
    console.error('[authController.login]', err);
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
    return res.json({ user, accessToken: generateAccessToken({ id: user.id, email: user.email, role: user.role, sid: session.id }) });
  } catch (err) { return res.status(503).json({ error: 'Session service unavailable' }); }
}
async function session(req, res) {
  try { return res.sendStatus(await sessions.resolve(cookie.read(req)) ? 204 : 401); }
  catch (err) { return res.sendStatus(503); }
}
async function logout(req, res) {
  try {
    await sessions.revoke(cookie.read(req));
    cookie.clear(res);
    return res.sendStatus(204);
  } catch (err) { return res.status(503).json({ error: 'Logout failed; please retry' }); }
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

    return res.status(200).json({ user });
  } catch (err) {
    console.error('[authController.getProfile]', err);
    return res.status(500).json({ error: 'Could not retrieve profile' });
  }
}

module.exports = { register, login, refreshToken, getProfile, session, logout };
