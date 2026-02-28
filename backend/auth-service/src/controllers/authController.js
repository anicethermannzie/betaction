const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');

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

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
      accessToken,
      refreshToken,
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

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[authController.login]', err);
    return res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * POST /api/auth/refresh-token
 * Body: { refreshToken }
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;

    let decoded;
    try {
      decoded = verifyToken(token, 'refresh');
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Refresh token has expired, please log in again'
          : 'Invalid refresh token';
      return res.status(401).json({ error: message });
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    const newAccessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('[authController.refreshToken]', err);
    return res.status(500).json({ error: 'Could not refresh token' });
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

    return res.status(200).json({ user });
  } catch (err) {
    console.error('[authController.getProfile]', err);
    return res.status(500).json({ error: 'Could not retrieve profile' });
  }
}

module.exports = { register, login, refreshToken, getProfile };
