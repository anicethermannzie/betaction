'use strict';

// Keep this policy aligned in the independently deployed JWT consumers.
function validateJwtSecrets(env = process.env) {
  const names = ["JWT_ACCESS_SECRET","JWT_REFRESH_SECRET"];
  for (const name of names) {
    const value = env[name];
    if (typeof value !== 'string' || Buffer.byteLength(value.trim(), 'utf8') < 32 ||
        /your[\s_-]|change[\s_-]?me|change[\s_-]?in|replace[\s_-]?|placeholder|example|<|>/i.test(value)) {
      throw new Error(name + ' must contain at least 32 bytes and must not be a placeholder');
    }
  }
}

module.exports = { validateJwtSecrets };
