const { verifyToken } = require('../utils/jwt');

/**
 * Express middleware that validates the Authorization: Bearer <token> header.
 * On success, attaches the decoded payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token, 'access');
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token has expired' });
    }
    return res.status(401).json({ error: 'Invalid access token' });
  }
}

module.exports = { authenticate };
