require('dotenv').config();

const logger = require('./utils/logger');

// Fail before loading modules that open connections or accept traffic.
try {
  require('./config/jwt').validateJwtSecrets();
} catch (err) {
  logger.error('Failed to start', { error: err.message });
  process.exit(1);
}
const app = require('./app');
const { pool } = require('./config/database');
const { runMigrations } = require('./config/migrate');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // Verify DB connectivity before accepting traffic
    await pool.query('SELECT 1');
    logger.info('PostgreSQL connected');

    // Schema is versioned in migrations/ and applied here. The service must not
    // serve traffic against a database it has not migrated.
    await runMigrations();

    app.listen(PORT, () => {
      logger.info('Listening', { port: PORT });
    });
  } catch (err) {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  }
}

start();
