const { pool } = require('../config/database');

// Every read returns the entitlement columns: the access token embeds them, so a
// query that omits them silently issues a token with no plan claim.
const PUBLIC_COLUMNS = 'id, username, email, role, plan, trial_ends_at, created_at';

/**
 * Create a new user record.
 *
 * New accounts start on the free plan with the 7-day trial advertised on the
 * pricing page. The trial window is stored, not computed at read time, so that
 * changing the trial length later does not retroactively move existing users.
 *
 * @param {object} p
 * @param {string} p.username
 * @param {string} p.email
 * @param {string} p.passwordHash  - bcrypt hash
 * @returns {Promise<object>} Created user row (without password_hash)
 */
async function create({ username, email, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash, plan, trial_ends_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'free', NOW() + INTERVAL '7 days', NOW(), NOW())
     RETURNING ${PUBLIC_COLUMNS}`,
    [username, email, passwordHash]
  );
  return rows[0];
}

/**
 * Find a user by email (includes password_hash for verification).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash
     FROM users
     WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Find a user by id (excludes password_hash).
 * @param {string|number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Permanently delete a user row.
 *
 * `auth_sessions`, `auth_refresh_tokens` and `subscriptions` all declare
 * `ON DELETE CASCADE` on their user_id/session_id foreign keys (migrations
 * 002 and 004), so this one statement is enough to remove every row that
 * belongs to the account. It does NOT touch Stripe — the caller is
 * responsible for canceling any live subscription first (see
 * authController.deleteAccount), since an orphaned DB row can't be
 * cancelled after the fact.
 *
 * @param {string|number} id
 * @returns {Promise<boolean>} true if a row was deleted, false if the id
 *   didn't exist (already deleted, or never existed).
 */
async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return rowCount > 0;
}

/**
 * Set a new password hash — the only writer of password_hash outside create().
 * Used by passwordResetController once a reset token has been consumed.
 *
 * @param {string|number} id
 * @param {string} passwordHash - bcrypt hash
 */
async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1', [id, passwordHash]);
}

module.exports = { create, findByEmail, findById, remove, updatePassword };
