require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/database');
const { runMigrations } = require('./utils/migrate');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // Verify DB connectivity before accepting traffic
    await pool.query('SELECT 1');
    console.log('[auth-service] PostgreSQL connected');

    // Run any pending SQL migrations before accepting traffic
    await runMigrations(pool);
    console.log('[auth-service] Migrations up to date');

    app.listen(PORT, () => {
      console.log(`[auth-service] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[auth-service] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
