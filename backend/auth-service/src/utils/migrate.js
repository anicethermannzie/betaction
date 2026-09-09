const fs   = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

/**
 * Runs all pending SQL migration files in filename order.
 *
 * Strategy:
 *  - Creates a `schema_migrations` table on first run.
 *  - Each migration file is recorded by filename; already-applied files are skipped.
 *  - Runs inside a transaction so a partial failure leaves the DB clean.
 *
 * @param {import('pg').Pool} pool
 */
async function runMigrations(pool) {
  // Ensure the tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  // Read migration files sorted by name (lexicographic = numeric order with zero-padded names)
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const filename of files) {
    const { rows } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [filename]
    );

    if (rows.length > 0) {
      console.log(`[migrate] Already applied: ${filename}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [filename]
      );
      await client.query('COMMIT');
      console.log(`[migrate] Applied: ${filename}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration failed (${filename}): ${err.message}`);
    } finally {
      client.release();
    }
  }
}

module.exports = { runMigrations };
