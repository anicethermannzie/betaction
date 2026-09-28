'use strict';

/**
 * Entitlement claims embedded in the access token.
 *
 * prediction-service verifies the token locally with JWT_ACCESS_SECRET and reads
 * these claims to decide how much of a response to build. No network hop and no
 * shared database: the 15-minute token lifetime is the propagation delay for a
 * plan change, which is an acceptable trade for keeping the services decoupled.
 *
 * Claim names are snake_case because the consumer is Python — keep them stable,
 * they are a cross-service contract. Any change here must ship with a matching
 * change in prediction-service/src/middleware/auth.py.
 *
 * PRODUCT DECISION (confirmed 2026-09-14): the trial does NOT grant VIP access.
 * A trial user gets the same restricted response as any free caller — 6 of 18
 * markets, no factor breakdown, 1 ticket capped at 3 legs — exactly what the
 * pricing table shows under "Free trial". VIP is the paid unlock, not something
 * a trial confers. Keep TRIAL_GRANTS_VIP false unless product explicitly
 * reverses this.
 */

const TRIAL_GRANTS_VIP = false;

/**
 * Build the entitlement half of a token payload from a user row.
 * @param {object} user - row from userModel (needs plan, trial_ends_at)
 */
function claimsFor(user) {
  const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at).toISOString() : null;
  return { plan: user.plan || 'free', trial_ends_at: trialEndsAt };
}

/**
 * Resolve what a set of claims is actually allowed to see right now.
 * Mirrored by resolve_plan() in prediction-service/src/middleware/auth.py.
 * @returns {'vip'|'free'}
 */
function effectivePlan({ plan, trial_ends_at: trialEndsAt } = {}) {
  if (plan === 'vip') return 'vip';
  if (TRIAL_GRANTS_VIP && trialEndsAt && new Date(trialEndsAt) > new Date()) return 'vip';
  return 'free';
}

module.exports = { claimsFor, effectivePlan, TRIAL_GRANTS_VIP };
