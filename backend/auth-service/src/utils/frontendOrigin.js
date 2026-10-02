'use strict';

/**
 * The browser-facing frontend origin, used to build links that leave the
 * server (Stripe redirect targets, password-reset email links). Reuses
 * CORS_ORIGIN rather than introducing a second "the frontend's URL" variable
 * that could drift out of sync with it — see sessionCookie.protect, which
 * CORS_ORIGIN also gates.
 */
function frontendOrigin() {
  return process.env.CORS_ORIGIN || 'http://localhost:3000';
}

module.exports = { frontendOrigin };
