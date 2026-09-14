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

module.exports = { create, findByEmail, findById };
