'use strict';

/**
 * Structured JSON logger.
 *
 * Every log line is a single JSON object written to stdout/stderr, making it
 * trivially parseable by log aggregators (CloudWatch, Loki, Datadog, etc.).
 *
 * Format:
 *   { "timestamp": "ISO", "level": "info|warn|error|debug",
 *     "service": "notification-service", "message": "...", ...meta }
 */

const SERVICE_NAME = 'notification-service';
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
