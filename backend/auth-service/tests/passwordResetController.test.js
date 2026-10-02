/**
 * Tests for passwordResetController.
 *
 * forgotPassword's whole point is that its response must never reveal
 * anything about whether the email exists or whether sending succeeded — the
 * tests assert the response is identical across those cases, not just that
 * each case individually "works".
 */

jest.mock('../src/models/userModel');
jest.mock('../src/models/passwordResetModel');
jest.mock('../src/models/sessionModel');
jest.mock('../src/config/email', () => ({ sendPasswordResetEmail: jest.fn() }));
jest.mock('bcryptjs', () => ({ hash: jest.fn() }));

const bcrypt = require('bcryptjs');
const userModel = require('../src/models/userModel');
const passwordResetModel = require('../src/models/passwordResetModel');
const sessions = require('../src/models/sessionModel');
const { sendPasswordResetEmail } = require('../src/config/email');
const passwordResetController = require('../src/controllers/passwordResetController');

function makeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('forgotPassword', () => {
  test('responds identically whether the email exists or not', async () => {
    userModel.findByEmail.mockResolvedValueOnce({ id: 1, email: 'real@example.com' });
    const resFound = makeRes();
    await passwordResetController.forgotPassword({ body: { email: 'real@example.com' } }, resFound);

    userModel.findByEmail.mockResolvedValueOnce(null);
    const resMissing = makeRes();
    await passwordResetController.forgotPassword({ body: { email: 'nobody@example.com' } }, resMissing);

    expect(resFound.statusCode).toBe(200);
    expect(resMissing.statusCode).toBe(200);
    expect(resFound.body).toEqual(resMissing.body);
  });

  test('responds 200 even when sending the email throws', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 1, email: 'real@example.com' });
    passwordResetModel.createToken.mockResolvedValue('a-raw-token');
    sendPasswordResetEmail.mockRejectedValue(new Error('SES is not configured'));

    const res = makeRes();
    await passwordResetController.forgotPassword({ body: { email: 'real@example.com' } }, res);

    expect(res.statusCode).toBe(200);
  });

  test('issues a token and emails it to the account on file when the email exists', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 42, email: 'real@example.com' });
    passwordResetModel.createToken.mockResolvedValue('a-raw-token');

    await passwordResetController.forgotPassword({ body: { email: 'real@example.com' } }, makeRes());

    expect(passwordResetModel.createToken).toHaveBeenCalledWith(42);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('real@example.com', expect.stringContaining('a-raw-token'));
  });

  test('does not touch the token model or mailer when the email does not exist', async () => {
    userModel.findByEmail.mockResolvedValue(null);

    await passwordResetController.forgotPassword({ body: { email: 'nobody@example.com' } }, makeRes());

    expect(passwordResetModel.createToken).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe('resetPassword', () => {
  test('rejects an invalid or expired token without touching the password', async () => {
    passwordResetModel.consume.mockResolvedValue(null);

    const res = makeRes();
    await passwordResetController.resetPassword({ body: { token: 'bad', password: 'NewPass123' } }, res);

    expect(res.statusCode).toBe(400);
    expect(userModel.updatePassword).not.toHaveBeenCalled();
    expect(sessions.revokeAllForUser).not.toHaveBeenCalled();
  });

  test('on a valid token, hashes the new password, updates it, and revokes every session', async () => {
    passwordResetModel.consume.mockResolvedValue(7);
    bcrypt.hash.mockResolvedValue('hashed-password');

    const res = makeRes();
    await passwordResetController.resetPassword({ body: { token: 'good', password: 'NewPass123' } }, res);

    expect(userModel.updatePassword).toHaveBeenCalledWith(7, 'hashed-password');
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith(7);
    expect(res.statusCode).toBe(200);
  });
});
