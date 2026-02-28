const { pool } = require('../config/database');

/**
 * Create a new user record.
 * @param {object} p
 * @param {string} p.username
 * @param {string} p.email
 * @param {string} p.passwordHash  - bcrypt hash
 * @returns {Promise<object>} Created user row (without password_hash)
 */
async function create({ username, email, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING id, username, email, role, created_at`,
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
    `SELECT id, username, email, password_hash, role, created_at
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
    `SELECT id, username, email, role, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { create, findByEmail, findById };
