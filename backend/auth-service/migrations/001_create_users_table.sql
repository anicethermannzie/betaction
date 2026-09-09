-- Migration: 001_create_users_table
-- Creates the users and refresh_tokens tables for auth-service.

-- Enable pgcrypto for gen_random_uuid() on PostgreSQL < 13
-- (PostgreSQL 13+ has it built-in via gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── users ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(30)   NOT NULL UNIQUE,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ── refresh_tokens ────────────────────────────────────────────────────────────
-- Stores issued refresh tokens to allow future revocation.
-- The current auth flow is stateless (JWT-only); this table is ready
-- for use when token blacklisting / logout-all-devices is implemented.

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id  ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token    ON refresh_tokens (token);
