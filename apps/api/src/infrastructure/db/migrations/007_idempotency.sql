-- Idempotency cache: client can retry a request with the same key and get
-- the same server response instead of creating duplicate resources. Scoped
-- per (actor, method, path) so two users can reuse keys independently.

CREATE TABLE IF NOT EXISTS idempotent_responses (
  key VARCHAR(120) NOT NULL,
  actor_id UUID,
  method VARCHAR(8) NOT NULL,
  path VARCHAR(200) NOT NULL,
  request_hash VARCHAR(128) NOT NULL,
  status_code INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (key, actor_id, method, path)
);

CREATE INDEX IF NOT EXISTS idx_idempotent_responses_created
  ON idempotent_responses(created_at DESC);
