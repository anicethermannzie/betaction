'use strict';

const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const passwordResetModel = require('../models/passwordResetModel');
const sessions = require('../models/sessionModel');
const { sendPasswordResetEmail } = require('../config/email');
const { frontendOrigin } = require('../utils/frontendOrigin');
const logger = require('../utils/logger');

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Always responds 200 with the same generic message, whether or not the
 * email belongs to an account and whether or not sending the email actually
 * succeeded. Any difference there — a 404 for an unknown email, a 503 when
 * SES is misconfigured — is an account-enumeration side channel: an attacker
 * could tell which emails have accounts just by watching which responses
 * differ. Failures are logged for ops visibility instead of surfaced to the
 * caller.
 */
async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    const user = await userModel.findByEmail(email);
    if (user) {
      try {
        const token = await passwordResetModel.createToken(user.id);
        const resetUrl = `${frontendOrigin()}/reset-password?token=${token}`;
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (err) {
        logger.error('Failed to send password reset email', { error: err.message, userId: user.id });
      }
    }
  } catch (err) {
    logger.error('forgot-password lookup failed', { error: err.message });
  }

  return res.status(200).json({ message: 'If that email is registered, a password reset link has been sent.' });
}

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 *
 * Consuming the token also invalidates every other outstanding token for the
 * account (passwordResetModel.consume) and revokes every existing session
 * (sessionModel.revokeAllForUser) — a password reset is as much "kick out
 * whoever might currently hold this account" as it is "set a new password".
 */
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    const userId = await passwordResetModel.consume(token);
    if (userId === null) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await userModel.updatePassword(userId, passwordHash);
    await sessions.revokeAllForUser(userId);

    return res.status(200).json({ message: 'Your password has been reset. Please sign in.' });
  } catch (err) {
    logger.error('Password reset failed', { error: err.message });
    return res.status(500).json({ error: 'Could not reset your password. Please try again.' });
  }
}

module.exports = { forgotPassword, resetPassword };
