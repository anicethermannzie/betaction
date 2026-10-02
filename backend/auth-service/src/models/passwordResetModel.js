'use strict';

const { randomBytes, createHash } = require('crypto');
const { pool } = require('../config/database');

const hash = (token) => createHash('sha256').update(token).digest('hex');

/**
 * Issue a new reset token for a user. Returns the raw token — only its hash
 * is stored (same reasoning as sessionModel's refresh tokens: a DB read alone
 * must not be enough to reset someone's password). Deliberately does not
 * invalidate other outstanding tokens for the user at issue time — someone
 * clicking "resend" twice should have either email still work. Older tokens
 * are only invalidated once one of them is actually used (see consume below).
 */
async function createToken(userId) {
  const token = randomBytes(32).toString('hex');
  await pool.query(
    `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
    [hash(token), userId]
  );
  return token;
}

/**
 * Validate and consume a reset token in one atomic step (row lock prevents
 * two concurrent requests both treating the same token as still valid).
 * Marks every other outstanding token for the same user used too, so a
 * second, older reset email can't reset the password again after this one
 * already has.
 *
 * @returns {Promise<number|null>} the user id if the token was valid and
 *   unused, null if it was missing, already used, or expired.
 */
async function consume(token) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT user_id, expires_at, used_at
         FROM password_reset_tokens
        WHERE token_hash = $1
        FOR UPDATE`,
      [hash(token)]
    );
    const row = rows[0];
    if (!row || row.used_at || new Date(row.expires_at) <= new Date()) {
      await client.query('COMMIT');
      return null;
    }
    await client.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
      [row.user_id]
    );
    await client.query('COMMIT');
    return row.user_id;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createToken, consume };
