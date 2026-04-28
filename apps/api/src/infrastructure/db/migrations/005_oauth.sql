-- =============================================================================
-- 005_oauth.sql — Add Google OAuth identity columns to users.
--
-- The legacy users table stored a non-null password_hash. With Google-only
-- auth, password_hash becomes meaningless: relax the NOT NULL constraint
-- and add columns to link the row to a Google identity.
--
-- Status lifecycle:
--   pending   -> first sign-in completed, awaiting admin approval
--   active    -> approved, can use the app
--   suspended -> revoked by an admin (login refused)
--
-- Idempotent: every ALTER uses IF NOT EXISTS / DO blocks so re-running the
-- migration on a re-applied database is safe.
-- =============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20),
  ADD COLUMN IF NOT EXISTS oauth_subject  VARCHAR(120),
  ADD COLUMN IF NOT EXISTS picture_url    TEXT,
  ADD COLUMN IF NOT EXISTS status         VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by    UUID;

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

UPDATE users
SET status = 'active'
WHERE status = 'pending'
  AND approved_at IS NULL
  AND created_at < NOW() - INTERVAL '1 second';

CREATE UNIQUE INDEX IF NOT EXISTS users_oauth_provider_subject_uq
  ON users (oauth_provider, oauth_subject)
  WHERE oauth_provider IS NOT NULL AND oauth_subject IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);
