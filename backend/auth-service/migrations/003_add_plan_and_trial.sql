-- =============================================================================
-- 003 — subscription plan + trial window
--
-- Backs the entitlement claims embedded in the access token. prediction-service
-- reads those claims and shapes its response accordingly, so this column is the
-- single source of truth for what a customer is allowed to see.
--
-- NOTE: `plan` is set by billing, which does not exist yet. Until a payment
-- provider writes to it, every account is 'free' (with a trial) and no account
-- can become 'vip' through the application. That is deliberate: entitlement is
-- enforced now so that billing has a correct place to write later.
-- =============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan          VARCHAR(20) NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

DO $$
BEGIN
  ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'vip'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Accounts that predate this migration never received a trial at registration.
-- Grant them the same 7 days the pricing page advertises, measured from now.
UPDATE users
   SET trial_ends_at = NOW() + INTERVAL '7 days'
 WHERE trial_ends_at IS NULL
   AND plan = 'free';
