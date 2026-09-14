-- =============================================================================
-- 004 — Stripe billing: customer linkage, subscription history, webhook ledger
--
-- users.plan (003) remains the single source of truth prediction-service reads
-- via the JWT claim — everything here exists to keep that column correct and to
-- give the account owner something to manage. Nothing added here is read by
-- any service except auth-service itself.
-- =============================================================================

-- One Stripe Customer per user, created lazily on first checkout and reused for
-- the life of the account (including across cancel/resubscribe), so a user who
-- abandons checkout and returns later does not accumulate duplicate Stripe
-- customers.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_key
  ON users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Subscription history. One row per Stripe Subscription object, upserted on
-- every relevant webhook event. A user who cancels and later resubscribes gets
-- a second row (a new Stripe subscription id) rather than overwriting the first
-- — this is a history table, not just a cache of "current state".
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     SERIAL PRIMARY KEY,
  user_id                INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id     VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL,
  status                 VARCHAR(20)  NOT NULL,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_key
  ON subscriptions (stripe_subscription_id);

-- GET /billing/status reads "this user's most recent subscription" — this index
-- makes that a cheap indexed lookup instead of a sequential scan.
CREATE INDEX IF NOT EXISTS subscriptions_user_id_created_at_idx
  ON subscriptions (user_id, created_at DESC);

DO $$
BEGIN
  ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Idempotency ledger. Stripe redelivers an event whenever our endpoint doesn't
-- answer 200 quickly, so the same event id can arrive more than once. The
-- webhook handler claims an event by inserting its id here inside the same
-- transaction as the side effect (plan change, subscription upsert) — if the
-- insert conflicts, the event was already fully processed and is a no-op; if
-- the transaction rolls back for any other reason, the claim rolls back with
-- it, so a genuine failure still gets retried correctly.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id           VARCHAR(255) PRIMARY KEY,
  type         VARCHAR(100) NOT NULL,
  processed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
