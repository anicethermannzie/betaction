/**
 * Tests for config/stripe.js — the lazy client and the boot-time warning.
 *
 * No network call happens anywhere here: constructing a Stripe client does
 * not contact Stripe, it only validates the key is present.
 */

describe('config/stripe', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_ID;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('getStripeClient throws a clear error when STRIPE_SECRET_KEY is unset', () => {
    const { getStripeClient } = require('../src/config/stripe');
    expect(() => getStripeClient()).toThrow(/STRIPE_SECRET_KEY/);
  });

  test('getStripeClient returns a client once configured, and reuses it', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    const { getStripeClient } = require('../src/config/stripe');

    const first = getStripeClient();
    const second = getStripeClient();

    expect(first).toBeDefined();
    expect(second).toBe(first); // same instance — not reconstructed per call
  });

  test('getPriceId and getWebhookSecret throw when unset, return the value when set', () => {
    const { getPriceId, getWebhookSecret } = require('../src/config/stripe');
    expect(() => getPriceId()).toThrow(/STRIPE_PRICE_ID/);
    expect(() => getWebhookSecret()).toThrow(/STRIPE_WEBHOOK_SECRET/);

    process.env.STRIPE_PRICE_ID = 'price_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    const stripe = require('../src/config/stripe');
    expect(stripe.getPriceId()).toBe('price_123');
    expect(stripe.getWebhookSecret()).toBe('whsec_123');
  });

  test('warnIfUnconfigured logs which variables are missing, and only those', () => {
    const logger = require('../src/utils/logger');
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});

    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    // WEBHOOK_SECRET and PRICE_ID left unset.
    const { warnIfUnconfigured } = require('../src/config/stripe');
    warnIfUnconfigured();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [, meta] = warnSpy.mock.calls[0];
    expect(meta.missing).toEqual(['STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID']);

    warnSpy.mockRestore();
  });

  test('warnIfUnconfigured stays silent once everything is set', () => {
    const logger = require('../src/utils/logger');
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});

    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    process.env.STRIPE_PRICE_ID = 'price_123';
    const { warnIfUnconfigured } = require('../src/config/stripe');
    warnIfUnconfigured();

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
