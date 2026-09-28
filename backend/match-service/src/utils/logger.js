'use strict';

/**
 * Structured JSON logger — mirrors notification-service/src/utils/logger.js.
 *
 * Replaces console.* so that every line is one parseable JSON object for
 * CloudWatch. Kept per-service rather than shared: each service builds its own
 * image from its own directory, so a shared module would need a publish step.
 *
 * Format:
 *   { "timestamp": "ISO", "level": "info|warn|error|debug",
 *     "service": "match-service", "message": "...", ...meta }
 */

const SERVICE_NAME = 'match-service';
const IS_PROD = process.env.NODE_ENV === 'production';

function write(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    message,
    ...meta,
  };

  const line = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
  /** Debug lines are suppressed in production to reduce noise. */
  debug: (message, meta) => {
    if (!IS_PROD) write('debug', message, meta);
  },
};

module.exports = logger;
