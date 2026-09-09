const { randomBytes, randomUUID, createHash } = require('crypto');
const { pool } = require('../config/database');
const hash = token => createHash('sha256').update(token).digest('hex');
const newToken = () => randomBytes(32).toString('hex');
async function initialize() {
  await pool.query(`CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL, revoked BOOLEAN NOT NULL DEFAULT FALSE);
    CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
    token_hash TEXT PRIMARY KEY, session_id UUID NOT NULL REFERENCES auth_sessions(id) ON DELETE CASCADE,
    consumed BOOLEAN NOT NULL DEFAULT FALSE)`);
}
async function create(userId) {
  const id = randomUUID(), token = newToken();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query("INSERT INTO auth_sessions (id,user_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL '7 days') RETURNING *", [id,userId]);
    await client.query('INSERT INTO auth_refresh_tokens (token_hash,session_id) VALUES ($1,$2)', [hash(token),id]);
    await client.query('COMMIT');
    return { ...rows[0], token };
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
}
async function resolve(token, rotate = false) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT s.*, t.consumed FROM auth_refresh_tokens t
      JOIN auth_sessions s ON s.id=t.session_id WHERE t.token_hash=$1 FOR UPDATE OF s,t`, [hash(token)]);
    const session = rows[0];
    if (!session || session.revoked || new Date(session.expires_at) <= new Date()) {
      await client.query('COMMIT'); return null;
    }
    if (session.consumed) {
      await client.query('UPDATE auth_sessions SET revoked=TRUE WHERE id=$1', [session.id]);
      await client.query('COMMIT'); return null;
    }
    if (rotate) {
      session.token = newToken();
      await client.query('UPDATE auth_refresh_tokens SET consumed=TRUE WHERE token_hash=$1', [hash(token)]);
      await client.query('INSERT INTO auth_refresh_tokens (token_hash,session_id) VALUES ($1,$2)', [hash(session.token),session.id]);
    }
    await client.query('COMMIT'); return session;
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
}
async function revoke(token) {
  if (token) await pool.query(`UPDATE auth_sessions SET revoked=TRUE WHERE id IN
    (SELECT session_id FROM auth_refresh_tokens WHERE token_hash=$1)`, [hash(token)]);
}
async function active(id) {
  const { rows } = await pool.query('SELECT id FROM auth_sessions WHERE id=$1 AND revoked=FALSE AND expires_at>NOW()', [id]);
  return rows.length > 0;
}
module.exports = { initialize, create, resolve, revoke, active };
