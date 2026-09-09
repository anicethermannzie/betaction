const { test } = require('node:test');
const assert = require('node:assert/strict');
const databasePath = require.resolve('../src/config/database');
let row, calls;
const client = { query: async (sql, args) => {
  calls.push([sql, args]);
  return { rows: sql.startsWith('SELECT s.') ? (row ? [row] : []) : [] };
}, release() {} };
require.cache[databasePath] = { exports: { pool: { connect: async () => client, query: client.query } } };
const sessions = require('../src/models/sessionModel');
const cookie = require('../src/utils/sessionCookie');
const token = 'a'.repeat(64);
test('rotation consumes old token and stores only a hash of the replacement', async () => {
  calls = []; row = { id: 'session', expires_at: new Date(Date.now() + 60000), consumed: false, revoked: false };
  const result = await sessions.resolve(token, true);
  assert.match(result.token, /^[a-f0-9]{64}$/);
  assert.notEqual(result.token, token);
  assert.ok(calls.some(([sql]) => sql.includes('SET consumed=TRUE')));
  const insert = calls.find(([sql]) => sql.startsWith('INSERT'));
  assert.notEqual(insert[1][0], result.token);
  assert.equal(calls.at(-1)[0], 'COMMIT');
});
test('replay revokes the entire session without issuing another token', async () => {
  calls = []; row = { id: 'session', expires_at: new Date(Date.now() + 60000), consumed: true };
  assert.equal(await sessions.resolve(token, true), null);
  assert.ok(calls.some(([sql]) => sql.includes('SET revoked=TRUE')));
  assert.ok(!calls.some(([sql]) => sql.startsWith('INSERT')));
});
test('expired, revoked, missing and malformed credentials fail closed', async () => {
  for (const value of [undefined, { revoked: true }, { expires_at: new Date(0) }]) {
    calls = []; row = value;
    assert.equal(await sessions.resolve(token, true), null);
  }
  assert.equal(await sessions.resolve('mock.token'), null);
});
test('logout revokes sessions even when presented with an already consumed token', async () => {
  calls = []; await sessions.revoke(token);
  assert.match(calls[0][0], /SET revoked=TRUE/);
  assert.notEqual(calls[0][1][0], token);
});
test('cookie is HttpOnly, Secure and SameSite Strict outside explicit development', () => {
  const previous = process.env.NODE_ENV;
  try {
    for (const env of ['production', 'test', 'development']) {
      process.env.NODE_ENV = env;
      cookie.set({ cookie(name, value, options) {
        assert.equal(name, 'betaction-session'); assert.equal(options.httpOnly, true);
        assert.equal(options.secure, env !== 'development'); assert.equal(options.sameSite, 'strict');
        assert.equal(options.path, '/');
      } }, { token, expires_at: new Date() });
    }
  } finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});
test('CSRF defense rejects missing custom header and foreign origins', () => {
  for (const headers of [{}, { origin: 'https://attacker.example', 'x-requested-with': 'BetAction' }]) {
    let status;
    cookie.protect({ method: 'POST', get: name => headers[name] }, {
      set() {}, status(code) { status = code; return this; }, json() {},
    }, () => assert.fail('request accepted'));
    assert.equal(status, 403);
  }
});
