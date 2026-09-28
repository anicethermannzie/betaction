-- =============================================================================
-- 001 — users
--
-- This table was previously created by hand on the dev database and existed in
-- no file, so a clean deploy could never start: 002's foreign key to users(id)
-- failed and the service exited. Everything auth-service reads is declared here.
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(30)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Registration checks for an existing email before inserting, but that check and
-- the insert are not atomic: two concurrent signups can both pass it. The unique
-- index is what actually prevents duplicate accounts.
-- Emails are lowercased by the Joi validator before they reach the model.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);
