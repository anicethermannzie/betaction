-- =============================================================================
-- 002 — session + refresh token storage
--
-- Moved out of sessionModel.initialize(), which ran DDL on every boot. Schema
-- changes belong in versioned files, not in application start-up.
-- =============================================================================

CREATE TABLE IF NOT EXISTS auth_sessions (
  id         UUID        PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  token_hash TEXT    PRIMARY KEY,
  session_id UUID    NOT NULL REFERENCES auth_sessions(id) ON DELETE CASCADE,
  consumed   BOOLEAN NOT NULL DEFAULT FALSE
);

-- Every access-token verification calls sessionModel.active(id), which filters on
-- (id, revoked, expires_at); the primary key covers the lookup. This index serves
-- the other direction — revoking or listing all sessions for one user.
CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions (user_id);
