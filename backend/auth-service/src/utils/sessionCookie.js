const name = 'betaction-session';
const options = () => ({ httpOnly: true, secure: process.env.NODE_ENV !== 'development', sameSite: 'strict', path: '/' });
function read(req) {
  const value = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  return value ? value.slice(name.length + 1) : null;
}
function set(res, session) { res.cookie(name, session.token, { ...options(), expires: new Date(session.expires_at) }); }
function clear(res) { res.clearCookie(name, options()); }
function protect(req, res, next) {
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.get('origin');
    const allowed = process.env.CORS_ORIGIN || 'http://localhost:3000';
    if (req.get('x-requested-with') !== 'BetAction' || (origin && origin !== allowed)) {
      return res.status(403).json({ error: 'Invalid request origin' });
    }
  }
  next();
}
module.exports = { read, set, clear, protect };
