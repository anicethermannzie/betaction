require('dotenv').config();
const logger = require('./utils/logger');
const app = require('./app');
const redis = require('./config/redis');
const { startLiveMatchesJob } = require('./jobs/liveMatchesJob');
const { startTodayMatchesJob } = require('./jobs/todayMatchesJob');

const PORT = process.env.PORT || 3002;

async function start() {
  try {
    await redis.ping();
    logger.info('Redis connected');

    startLiveMatchesJob();
    startTodayMatchesJob();

    app.listen(PORT, () => {
      logger.info('Listening', { port: PORT });
    });
  } catch (err) {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  }
}

start();
