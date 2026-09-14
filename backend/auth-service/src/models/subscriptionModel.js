'use strict';

const { pool } = require('../config/database');

/**
 * DB access for billing. Kept separate from userModel because it is read/
 * written only by billingController — nothing else in the request lifecycle
 * touches these tables.
 */

/** Set (or confirm) the Stripe customer id for a user. Idempotent. */
async function setStripeCustomerId(userId, stripeCustomerId) {
  await pool.query(
    `UPDATE users SET stripe_customer_id = $2, updated_at = NOW() WHERE id = $1`,
    [userId, stripeCustomerId]
  );
}

/** @returns {Promise<string|null>} */
async function getStripeCustomerId(userId) {
  const { rows } = await pool.query(
    `SELECT stripe_customer_id FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0]?.stripe_customer_id ?? null;
}

/**
 * Find the internal user id for a Stripe customer id.
 * Used by webhook handlers, which only carry Stripe ids.
 */
async function findUserIdByStripeCustomerId(stripeCustomerId) {
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE stripe_customer_id = $1`,
    [stripeCustomerId]
  );
  return rows[0]?.id ?? null;
}

/** Set the plan users.plan / JWT claims are built from. The only writer of entitlement. */
async function setPlan(client, userId, plan) {
  await client.query(
    `UPDATE users SET plan = $2, updated_at = NOW() WHERE id = $1`,
    [userId, plan]
  );
}

/**
 * Insert or update the subscription row for a Stripe subscription id.
 * Must be called with a client already inside the webhook's transaction —
 * see billingController.webhook for why (atomic with the idempotency claim).
 */
async function upsertSubscription(client, {
  userId, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd, cancelAtPeriodEnd,
}) {
  await client.query(
    `INSERT INTO subscriptions
       (user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (stripe_subscription_id) DO UPDATE
       SET status = EXCLUDED.status,
           current_period_end = EXCLUDED.current_period_end,
           cancel_at_period_end = EXCLUDED.cancel_at_period_end,
           updated_at = NOW()`,
    [userId, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd, cancelAtPeriodEnd]
  );
}

/** Find the internal user id owning a Stripe subscription. */
async function findUserIdByStripeSubscriptionId(client, stripeSubscriptionId) {
  const { rows } = await client.query(
    `SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1`,
    [stripeSubscriptionId]
  );
  return rows[0]?.user_id ?? null;
}

/**
 * Mark a subscription past_due without touching current_period_end or
 * cancel_at_period_end — invoice.payment_failed carries no reliable value for
 * either, unlike the subscription-object-driven upsertSubscription above.
 */
async function markPastDue(client, stripeSubscriptionId) {
  await client.query(
    `UPDATE subscriptions SET status = 'past_due', updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [stripeSubscriptionId]
  );
}

/**
 * Most recent subscription for a user — what GET /billing/status shows.
 * A user with no Stripe history at all gets null, which is a valid state
 * (free plan, never subscribed), not an error.
 */
async function findLatestByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT status, current_period_end, cancel_at_period_end
       FROM subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId]
  );
  return rows[0] ?? null;
}

// ── Webhook idempotency ────────────────────────────────────────────────────

/**
 * Claim a Stripe event id inside the given transaction.
 * @returns {Promise<boolean>} true if this call claimed it (process it),
 *   false if it was already processed (skip — this is a Stripe retry).
 */
async function claimWebhookEvent(client, eventId, eventType) {
  const { rows } = await client.query(
    `INSERT INTO stripe_webhook_events (id, type) VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING
     RETURNING id`,
    [eventId, eventType]
  );
  return rows.length > 0;
}

module.exports = {
  setStripeCustomerId,
  getStripeCustomerId,
  findUserIdByStripeCustomerId,
  setPlan,
  upsertSubscription,
  findUserIdByStripeSubscriptionId,
  markPastDue,
  findLatestByUserId,
  claimWebhookEvent,
};
