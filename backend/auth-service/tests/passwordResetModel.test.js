/**
 * Tests for passwordResetModel.consume's atomicity: the row lock + single
 * UPDATE inside one transaction is what makes a token genuinely single-use
 * under concurrent requests, so this exercises the actual SQL sequence
 * against a scripted fake client rather than mocking consume() itself away.
 */

let row, calls;
const mockClient = {
  query: async (sql, args) => {
    calls.push([sql, args]);
    if (sql.startsWith('SELECT user_id')) return { rows: row ? [row] : [] };
    return { rows: [] };
  },
  release: jest.fn(),
};

jest.mock('../src/config/database', () => ({ pool: { connect: async () => mockClient } }));

const passwordResetModel = require('../src/models/passwordResetModel');

beforeEach(() => {
  calls = [];
  jest.clearAllMocks();
});

test('a valid, unused, unexpired token is consumed and marks the user id', async () => {
  row = { user_id: 7, expires_at: new Date(Date.now() + 60000), used_at: null };
  const userId = await passwordResetModel.consume('a-raw-token');

  expect(userId).toBe(7);
  expect(calls.some(([sql]) => sql.includes('SELECT user_id') && sql.includes('FOR UPDATE'))).toBe(true);
  const update = calls.find(([sql]) => sql.startsWith('UPDATE password_reset_tokens'));
  expect(update[1]).toEqual([7]);
  expect(calls.at(-1)[0]).toBe('COMMIT');
});

test('an already-used token is rejected without a second UPDATE', async () => {
  row = { user_id: 7, expires_at: new Date(Date.now() + 60000), used_at: new Date() };
  const userId = await passwordResetModel.consume('a-raw-token');

  expect(userId).toBeNull();
  expect(calls.some(([sql]) => sql.startsWith('UPDATE'))).toBe(false);
});

test('an expired token is rejected', async () => {
  row = { user_id: 7, expires_at: new Date(Date.now() - 1000), used_at: null };
  expect(await passwordResetModel.consume('a-raw-token')).toBeNull();
});

test('a token that does not exist is rejected', async () => {
  row = undefined;
  expect(await passwordResetModel.consume('never-issued')).toBeNull();
});

test('only the token hash is ever sent to the database, never the raw token', async () => {
  row = { user_id: 7, expires_at: new Date(Date.now() + 60000), used_at: null };
  await passwordResetModel.consume('a-raw-token');

  const select = calls.find(([sql]) => sql.startsWith('SELECT user_id'));
  expect(select[1][0]).not.toBe('a-raw-token');
  expect(select[1][0]).toMatch(/^[a-f0-9]{64}$/);
});
