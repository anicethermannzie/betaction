require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 3001;

/**
 * Apply the database schema. Idempotent (CREATE TABLE IF NOT EXISTS …), so it
 * is safe to run on every boot — a fresh database becomes usable without any
 * manual migration step.
 */
async function ensureSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('[auth-service] Schema ensured');
}

async function start() {
  try {
    // Verify DB connectivity before accepting traffic
    await pool.query('SELECT 1');
    console.log('[auth-service] PostgreSQL connected');

    await ensureSchema();

    app.listen(PORT, () => {
      console.log(`[auth-service] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[auth-service] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
