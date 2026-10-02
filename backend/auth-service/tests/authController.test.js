/**
 * Tests for authController.deleteAccount.
 *
 * Mirrors billingController.test.js's mocking approach: models and the Stripe
 * client factory are mocked, bcrypt's compare is mocked rather than hashing a
 * real password (that round-trip is already covered by register/login, not
 * what this file is testing).
 */

const mockStripeClient = { subscriptions: { cancel: jest.fn() } };

jest.mock('../src/config/stripe', () => ({
  getStripeClient: jest.fn(() => mockStripeClient),
}));
jest.mock('../src/models/userModel');
jest.mock('../src/models/subscriptionModel');
jest.mock('../src/utils/sessionCookie', () => ({ clear: jest.fn() }));
jest.mock('bcryptjs', () => ({ compare: jest.fn() }));

const bcrypt = require('bcryptjs');
const userModel = require('../src/models/userModel');
const subscriptionModel = require('../src/models/subscriptionModel');
const cookie = require('../src/utils/sessionCookie');
const { getStripeClient } = require('../src/config/stripe');
const authController = require('../src/controllers/authController');

function makeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    sendStatus(code) { this.statusCode = code; this.body = undefined; return this; },
  };
}

function makeReq(overrides = {}) {
  return { user: { id: 7, email: 'user@example.com' }, body: { password: 'correct-password' }, ...overrides };
}

const existingUser = { id: 7, email: 'user@example.com', password_hash: 'hashed' };

beforeEach(() => {
  jest.clearAllMocks();
  userModel.findByEmail.mockResolvedValue(existingUser);
  bcrypt.compare.mockResolvedValue(true);
  subscriptionModel.findActiveStripeSubscriptionId.mockResolvedValue(null);
  userModel.remove.mockResolvedValue(true);
});

test('deletes the account and clears the cookie when there is no active subscription', async () => {
  const req = makeReq();
  const res = makeRes();

  await authController.deleteAccount(req, res);

  expect(userModel.remove).toHaveBeenCalledWith(7);
  expect(cookie.clear).toHaveBeenCalledWith(res);
  expect(mockStripeClient.subscriptions.cancel).not.toHaveBeenCalled();
  expect(res.statusCode).toBe(204);
});

test('cancels the live Stripe subscription before deleting the row', async () => {
  subscriptionModel.findActiveStripeSubscriptionId.mockResolvedValue('sub_123');
  mockStripeClient.subscriptions.cancel.mockResolvedValue({});
  const req = makeReq();
  const res = makeRes();

  await authController.deleteAccount(req, res);

  const cancelOrder = mockStripeClient.subscriptions.cancel.mock.invocationCallOrder[0];
  const removeOrder = userModel.remove.mock.invocationCallOrder[0];
  expect(mockStripeClient.subscriptions.cancel).toHaveBeenCalledWith('sub_123');
  expect(cancelOrder).toBeLessThan(removeOrder);
  expect(res.statusCode).toBe(204);
});

test('refuses to delete the account if canceling the subscription fails', async () => {
  subscriptionModel.findActiveStripeSubscriptionId.mockResolvedValue('sub_123');
  mockStripeClient.subscriptions.cancel.mockRejectedValue(new Error('Stripe is down'));
  const req = makeReq();
  const res = makeRes();

  await authController.deleteAccount(req, res);

  expect(userModel.remove).not.toHaveBeenCalled();
  expect(cookie.clear).not.toHaveBeenCalled();
  expect(res.statusCode).toBe(502);
});

test('rejects an incorrect password without touching the account', async () => {
  bcrypt.compare.mockResolvedValue(false);
  const req = makeReq();
  const res = makeRes();

  await authController.deleteAccount(req, res);

  expect(userModel.remove).not.toHaveBeenCalled();
  expect(res.statusCode).toBe(401);
});

test('404s if the account behind the access token no longer exists', async () => {
  userModel.findByEmail.mockResolvedValue(null);
  const req = makeReq();
  const res = makeRes();

  await authController.deleteAccount(req, res);

  expect(bcrypt.compare).not.toHaveBeenCalled();
  expect(res.statusCode).toBe(404);
});
