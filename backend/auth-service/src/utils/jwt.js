const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRY = '15m';

/**
 * Generate a short-lived access token (15 minutes).
 * @param {object} payload - Data to embed: { id, email, role }
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Verify a JWT and return the decoded payload.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @param {'access'|'refresh'} type
 */
function verifyToken(token, type = 'access') {
  const secret =
    type === 'refresh'
      ? process.env.JWT_REFRESH_SECRET
      : process.env.JWT_ACCESS_SECRET;

  return jwt.verify(token, secret);
}

module.exports = { generateAccessToken, verifyToken };
