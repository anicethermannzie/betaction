'use strict';

const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');
const { pool } = require('./database');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = join(__dirname, '..', '..', 'migrations');

// Any positive 64-bit integer works; it only has to be the same in every task.
const ADVISORY_LOCK_KEY = 4837201;

/**
 * Apply every migration file that has not been recorded yet, in filename order.
 *
 * Several tasks boot at once on ECS, so the whole run is wrapped in a Postgres
 * session-level advisory lock: the first task migrates, the others block and
 * then find the work already recorded. Each file runs inside its own
 * transaction, so a failure leaves the database on the last good version rather
 * than half-migrated.
 */
async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);

    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

    const { rows } = await client.query('SELECT version FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.version));

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    let count = 0;

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info('Migration applied', { version: file });
        count += 1;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }

    logger.info('Migrations up to date', { applied: count, total: files.length });
  } finally {
    // Release before the connection returns to the pool; a session-level lock
    // would otherwise outlive this function on a reused connection.
    await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]).catch(() => {});
    client.release();
  }
}

module.exports = { runMigrations };
