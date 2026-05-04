-- WhatsApp outbox for transactional Fonnte deliveries. Same shape as
-- email_outbox (014) so the operations tooling — flush jobs, retry
-- monitoring, status filters — can be reused across notification
-- channels.
--
-- Status taxonomy:
--   pending   — enqueued, not yet attempted
--   sent      — accepted by Fonnte (provider_message_id set)
--   delivered — Fonnte webhook reported the message reached the device
--   read      — Fonnte webhook reported a read receipt (only when the
--               recipient has read receipts enabled)
--   failed    — exceeded max attempts; manual intervention needed

CREATE TABLE IF NOT EXISTS whatsapp_outbox (
  id UUID PRIMARY KEY,
  to_phone VARCHAR(40) NOT NULL,
  template_key VARCHAR(60),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  provider VARCHAR(30) NOT NULL DEFAULT 'fonnte',
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

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_status_scheduled
  ON whatsapp_outbox(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_to ON whatsapp_outbox(to_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_related
  ON whatsapp_outbox(related_entity, related_id);

-- Per-provider unique message id so re-enqueueing the same Fonnte
-- message id (rare, but possible during webhook replay tests) is a
-- no-op rather than duplicating sent rows.
CREATE UNIQUE INDEX IF NOT EXISTS uq_whatsapp_outbox_provider_message
  ON whatsapp_outbox(provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL;
