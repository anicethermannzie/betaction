'use strict';

const { pool } = require('../config/database');
const { getStripeClient, getPriceId, getWebhookSecret } = require('../config/stripe');
const subscriptionModel = require('../models/subscriptionModel');
const userModel = require('../models/userModel');
const logger = require('../utils/logger');

// Statuses that mean "this account should see VIP" — mirrors the *effect* of
// resolve_plan()/effectivePlan() in the entitlement layer, but is evaluated
// here against Stripe's status rather than a JWT claim, because the webhook
// is what sets users.plan in the first place. 'trialing' counts as VIP: that
// is a Stripe-side trial on the subscription itself (e.g. a coupon-driven
// free period), a different concept from the app's own registration trial
// (users.trial_ends_at, which does NOT grant VIP — see utils/entitlements.js).
const VIP_STATUSES = new Set(['trialing', 'active']);

/**
 * Frontend origin, used only to build Stripe's redirect targets
 * (success_url, cancel_url, the billing portal's return_url). Reuses
 * CORS_ORIGIN rather than introducing a second "the frontend's URL" variable
 * that could drift out of sync with it.
 */
function frontendOrigin() {
  return process.env.CORS_ORIGIN || 'http://localhost:3000';
}

/**
 * Stripe Subscription objects moved current_period_end from the subscription
 * itself onto its first item in more recent API versions. Neither this
 * environment nor the sandbox that built it can make a live Stripe test call
 * to confirm which shape the configured API version actually returns, so this
 * checks both rather than assuming one. Verify against a real test-mode event
 * (Stripe CLI: `stripe trigger customer.subscription.updated`) before
 * shipping — see the PR description for exactly this caveat.
 */
function extractCurrentPeriodEnd(subscription) {
  const unixSeconds = subscription.current_period_end
    ?? subscription.items?.data?.[0]?.current_period_end
    ?? null;
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

/**
 * Stripe's Invoice → Subscription link has moved at least once across API
 * versions (a top-level `subscription` string vs. a nested
 * `parent.subscription_details.subscription`). Same caveat as above: checked
 * defensively, not verified against a live event in this environment.
 */
function extractInvoiceSubscriptionId(invoice) {
  const raw = invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? null;
  if (!raw) return null;
  return typeof raw === 'string' ? raw : raw.id;
}

// ── POST /billing/create-checkout-session ────────────────────────────────────

async function createCheckoutSession(req, res) {
  let stripe;
  try {
    stripe = getStripeClient();
  } catch (err) {
    logger.error('Checkout requested but billing is not configured', { error: err.message });
    return res.status(503).json({ error: 'Billing is temporarily unavailable' });
  }

  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let customerId = await subscriptionModel.getStripeCustomerId(user.id);
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id;
      await subscriptionModel.setStripeCustomerId(user.id, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      // The price is fixed server-side — never accept a price id from the
      // client, or a request could ask to "subscribe" at an arbitrary price.
      line_items: [{ price: getPriceId(), quantity: 1 }],
      success_url: `${frontendOrigin()}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendOrigin()}/billing/cancel`,
      // Belt-and-suspenders alongside `customer`: if a webhook event only
      // carries the customer id and, for whatever reason, that customer id
      // predates our stripe_customer_id column being set, this is a second
      // path back to the right user.
      metadata: { userId: String(user.id) },
      subscription_data: { metadata: { userId: String(user.id) } },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    logger.error('Failed to create checkout session', { error: err.message, userId: req.user.id });
    return res.status(502).json({ error: 'Could not start checkout. Please try again.' });
  }
}

// ── POST /billing/create-portal-session ──────────────────────────────────────

async function createPortalSession(req, res) {
  let stripe;
  try {
    stripe = getStripeClient();
  } catch (err) {
    logger.error('Portal requested but billing is not configured', { error: err.message });
    return res.status(503).json({ error: 'Billing is temporarily unavailable' });
  }

  try {
    const customerId = await subscriptionModel.getStripeCustomerId(req.user.id);
    if (!customerId) {
      return res.status(404).json({ error: 'No billing account found for this user' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendOrigin()}/profile`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    logger.error('Failed to create portal session', { error: err.message, userId: req.user.id });
    return res.status(502).json({ error: 'Could not open billing management. Please try again.' });
  }
}

// ── GET /billing/status ───────────────────────────────────────────────────────

/**
 * Entitlement + subscription detail for the current user.
 *
 * Deliberately client-agnostic: no Stripe ids, no web-specific fields (a
 * portal URL is fetched on demand via create-portal-session, not embedded
 * here). A future mobile client can call this exact endpoint read-only to
 * show plan state, even though it can never call create-checkout-session or
 * create-portal-session itself (Apple/Google forbid linking to external
 * payment from inside the app; the user manages billing on the web).
 */
async function getStatus(req, res) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const subscription = await subscriptionModel.findLatestByUserId(user.id);

    return res.status(200).json({
      plan: user.plan,
      trialEndsAt: user.trial_ends_at ?? null,
      subscription: subscription && {
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (err) {
    logger.error('Failed to load billing status', { error: err.message, userId: req.user.id });
    return res.status(500).json({ error: 'Could not load billing status' });
  }
}

// ── POST /billing/webhook ─────────────────────────────────────────────────────

/**
 * Verify the signature, then run the event's handler inside one transaction
 * that also claims the event id (subscriptionModel.claimWebhookEvent). If the
 * claim finds the event already processed, everything else is skipped and we
 * still answer 200 — Stripe redelivers on anything other than a 2xx, so an
 * already-handled event must look like success, not be reprocessed and not
 * error.
 */
async function webhook(req, res) {
  let event;
  try {
    const stripe = getStripeClient();
    const signature = req.headers['stripe-signature'];
    // express.raw() (mounted ahead of the JSON body parser — see app.js) hands
    // this handler the exact bytes Stripe signed. Anything that touched
    // req.body as JSON first would invalidate the signature.
    event = stripe.webhooks.constructEvent(req.body, signature, getWebhookSecret());
  } catch (err) {
    logger.warn('Webhook signature verification failed', { error: err.message });
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const claimed = await subscriptionModel.claimWebhookEvent(client, event.id, event.type);
    if (!claimed) {
      await client.query('COMMIT');
      logger.debug('Webhook event already processed, skipping', { eventId: event.id, type: event.type });
      return res.sendStatus(200);
    }

    await handleEvent(client, event);

    await client.query('COMMIT');
    return res.sendStatus(200);
  } catch (err) {
    await client.query('ROLLBACK');
    // The event claim rolled back too, so Stripe's retry will see this as
    // unprocessed and try again — which is what we want for a transient
    // failure (a dropped DB connection, a momentary Stripe API hiccup on the
    // subscription-retrieve call below).
    logger.error('Webhook processing failed — will be retried by Stripe', {
      error: err.message, eventId: event.id, type: event.type,
    });
    return res.status(500).json({ error: 'Webhook processing failed' });
  } finally {
    client.release();
  }
}

/** @param {import('pg').PoolClient} client */
async function handleEvent(client, event) {
  switch (event.type) {
    case 'checkout.session.completed':
      return onCheckoutSessionCompleted(client, event);
    case 'customer.subscription.updated':
      return onSubscriptionUpdated(client, event);
    case 'customer.subscription.deleted':
      return onSubscriptionDeleted(client, event);
    case 'invoice.payment_failed':
      return onInvoicePaymentFailed(client, event);
    default:
      // Any other event type reaching here means it was selected in the
      // Stripe dashboard webhook config but has no handler — acknowledge it
      // (200, via the caller) rather than erroring, so Stripe does not retry
      // an event we intentionally do not act on.
      logger.debug('Unhandled webhook event type, acknowledging without action', { type: event.type });
  }
}

async function onCheckoutSessionCompleted(client, event) {
  const session = event.data.object;
  if (session.mode !== 'subscription' || !session.subscription) return;

  const userId = await resolveUserId(client, {
    metadataUserId: session.metadata?.userId,
    stripeCustomerId: session.customer,
  });
  if (userId === null) {
    logger.error('checkout.session.completed for an unrecognised customer', {
      stripeCustomerId: session.customer, sessionId: session.id,
    });
    return;
  }

  // The Checkout Session confirms payment happened; the Subscription object
  // is the source of truth for status/period, so it is fetched fresh here
  // rather than trusted from the session payload.
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  await subscriptionModel.upsertSubscription(client, {
    userId,
    stripeCustomerId: session.customer,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: extractCurrentPeriodEnd(subscription),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });

  await subscriptionModel.setPlan(client, userId, VIP_STATUSES.has(subscription.status) ? 'vip' : 'free');
}

async function onSubscriptionUpdated(client, event) {
  const subscription = event.data.object;

  const userId = await subscriptionModel.findUserIdByStripeSubscriptionId(client, subscription.id)
    ?? await resolveUserId(client, {
      metadataUserId: subscription.metadata?.userId,
      stripeCustomerId: subscription.customer,
    });
  if (userId === null) {
    logger.error('customer.subscription.updated for an unrecognised subscription', {
      stripeSubscriptionId: subscription.id,
    });
    return;
  }

  await subscriptionModel.upsertSubscription(client, {
    userId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: extractCurrentPeriodEnd(subscription),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });

  // Covers recovery too: a subscription that went past_due and then
  // succeeded on a Stripe-retried payment fires this event with
  // status: 'active'. Without syncing plan here, that account would stay
  // downgraded (or never-upgraded) until it cancels and resubscribes.
  await subscriptionModel.setPlan(client, userId, VIP_STATUSES.has(subscription.status) ? 'vip' : 'free');
}

async function onSubscriptionDeleted(client, event) {
  const subscription = event.data.object;

  const userId = await subscriptionModel.findUserIdByStripeSubscriptionId(client, subscription.id)
    ?? await resolveUserId(client, {
      metadataUserId: subscription.metadata?.userId,
      stripeCustomerId: subscription.customer,
    });
  if (userId === null) {
    logger.error('customer.subscription.deleted for an unrecognised subscription', {
      stripeSubscriptionId: subscription.id,
    });
    return;
  }

  await subscriptionModel.upsertSubscription(client, {
    userId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    status: 'canceled',
    currentPeriodEnd: extractCurrentPeriodEnd(subscription),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });

  await subscriptionModel.setPlan(client, userId, 'free');
}

async function onInvoicePaymentFailed(client, event) {
  const invoice = event.data.object;
  const stripeSubscriptionId = extractInvoiceSubscriptionId(invoice);
  if (!stripeSubscriptionId) return; // a one-off invoice, not a subscription payment

  const userId = await subscriptionModel.findUserIdByStripeSubscriptionId(client, stripeSubscriptionId);
  if (userId === null) {
    logger.error('invoice.payment_failed for an unrecognised subscription', { stripeSubscriptionId });
    return;
  }

  // Deliberately does NOT touch users.plan. Stripe's own retry schedule (its
  // "smart retries") gets several more attempts before the subscription is
  // actually canceled, at which point customer.subscription.deleted downgrades
  // the account. Downgrading on the first failed payment would punish a
  // temporarily-declined card more harshly than Stripe's own billing does.
  await subscriptionModel.markPastDue(client, stripeSubscriptionId);
}

/**
 * Resolve a Stripe event to an internal user id via, in order: the metadata
 * we attach at checkout/subscription creation, then the stripe_customer_id
 * column on users. Two paths because metadata can be absent on objects
 * created outside our own checkout flow (e.g. a subscription added manually
 * in the Stripe dashboard for support purposes).
 */
async function resolveUserId(client, { metadataUserId, stripeCustomerId }) {
  if (metadataUserId) {
    const parsed = Number.parseInt(metadataUserId, 10);
    if (Number.isInteger(parsed)) return parsed;
  }
  if (stripeCustomerId) {
    const { rows } = await client.query('SELECT id FROM users WHERE stripe_customer_id = $1', [stripeCustomerId]);
    if (rows[0]) return rows[0].id;
  }
  return null;
}

module.exports = { createCheckoutSession, createPortalSession, getStatus, webhook };
