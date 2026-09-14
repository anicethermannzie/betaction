'use strict';

const Stripe = require('stripe');
const logger = require('../utils/logger');

/**
 * Stripe client, initialized lazily and on demand.
 *
 * Unlike JWT_ACCESS_SECRET (validated at boot — see server.js — because it
 * secures every authenticated request in the system), a missing Stripe key
 * only breaks the /billing/* endpoints. Refusing to boot the whole service
 * over it would take down login and session handling for everyone whenever
 * billing config drifts, which is a worse failure than billing alone
 * returning 503. Each billing route calls getStripeClient() itself and
 * responds 503 "Billing is not configured" if it throws, rather than crashing.
 *
 * A missing key is still logged loudly at boot (see server.js) so it is not
 * silently discovered by a customer clicking "Upgrade."
 */

let client = null;

function getStripeClient() {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  // No explicit apiVersion: the installed `stripe` package pins its own
  // default (currently 2026-08-26.dahlia) and validates it internally.
  // Hardcoding a guessed date string here risks pinning to a version that
  // does not exist, which fails every call rather than just the risk this
  // was meant to guard against. Upgrade the api version deliberately by
  // upgrading the `stripe` package, not by editing a string here.
  client = new Stripe(secretKey);
  return client;
}

/** Price to subscribe to. Never accept a price id from the client — see
 * billingController.createCheckoutSession for why. */
function getPriceId() {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error('STRIPE_PRICE_ID is not configured');
  }
  return priceId;
}

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return secret;
}

/**
 * Log (not throw) at boot if billing is unconfigured, so the gap is visible
 * in startup logs rather than only surfacing as a 503 the first time a
 * customer clicks "Upgrade."
 */
function warnIfUnconfigured() {
  const missing = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID']
    .filter((name) => !process.env[name]);
  if (missing.length > 0) {
    logger.warn('Billing is not configured — /billing/* will return 503', { missing });
  }
}

module.exports = { getStripeClient, getPriceId, getWebhookSecret, warnIfUnconfigured };
