-- Payment gateway integration columns on `payments`. Lets webhook deliveries
-- be processed idempotently using the gateway's own transaction ID (so the
-- same Midtrans `transaction_id` arriving twice is a no-op).

ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway VARCHAR(30);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS external_ref VARCHAR(120);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS raw_payload TEXT;

-- One transaction id per gateway is unique. Partial unique allows legacy
-- payments without external_ref to coexist while new gateway payments are
-- de-duplicated.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_external
  ON payments(gateway, external_ref)
  WHERE gateway IS NOT NULL AND external_ref IS NOT NULL;
