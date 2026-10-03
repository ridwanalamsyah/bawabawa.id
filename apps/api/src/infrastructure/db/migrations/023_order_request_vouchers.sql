-- Promo codes on website orders. A snapshot of the voucher terms is kept on
-- the order so the discount can be recomputed when the team sends the final
-- quote, even if the voucher is edited later.
ALTER TABLE order_requests
  ADD COLUMN IF NOT EXISTS voucher JSONB;

CREATE INDEX IF NOT EXISTS idx_order_requests_voucher_code
  ON order_requests ((voucher->>'code'))
  WHERE voucher IS NOT NULL;
