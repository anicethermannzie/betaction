-- =============================================================================
-- 005 — password reset tokens
--
-- Same shape as auth_refresh_tokens (002): the raw token is emailed to the
-- user and never stored — only its sha256 hash is, so a DB read alone can't
-- be used to reset someone's password. One row per outstanding reset request;
-- used_at makes a token single-use without having to delete it (the row stays
-- as an audit trail of when a reset actually happened).
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash TEXT        PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);

-- forgot-password issues a new token without invalidating older ones outright;
-- reset-password looks up by hash (the primary key) so this index serves the
-- other direction — invalidating a user's other outstanding tokens once one
-- of them is used (see passwordResetModel.invalidateOthersForUser).
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens (user_id);
