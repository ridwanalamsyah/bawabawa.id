-- Email outbox for transactional Resend deliveries. The route layer
-- enqueues into this table inside the same transaction as the business
-- event (e.g. order confirmation), and a background flusher (or sync
-- send for 1-shot use) ships them to Resend with retry tracking.
--
-- Status taxonomy (kept aligned with payments/shipments to make audit
-- trails consistent):
--   pending    — enqueued, not yet attempted
--   sent       — successfully accepted by Resend (provider_message_id set)
--   failed     — exceeded max attempts; manual intervention needed
--   bounced    — provider webhook reported a hard bounce
--   complained — provider webhook reported a spam complaint

CREATE TABLE IF NOT EXISTS email_outbox (
  id UUID PRIMARY KEY,
  to_email VARCHAR(320) NOT NULL,
  from_email VARCHAR(320),
  reply_to VARCHAR(320),
  subject VARCHAR(255) NOT NULL,
  template_key VARCHAR(60),
  html TEXT NOT NULL,
  text_body TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  provider VARCHAR(30) NOT NULL DEFAULT 'resend',
  provider_message_id VARCHAR(120),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  related_entity VARCHAR(60),
  related_id UUID,
  scheduled_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status_scheduled
  ON email_outbox(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_outbox_to ON email_outbox(to_email);
CREATE INDEX IF NOT EXISTS idx_email_outbox_related
  ON email_outbox(related_entity, related_id);

-- Resend message id is unique per provider — partial index allows multiple
-- pre-send rows (NULL message id) to coexist while preventing duplicate
-- "sent" rows for the same provider message id (e.g. from re-enqueueing).
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_outbox_provider_message
  ON email_outbox(provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL;
