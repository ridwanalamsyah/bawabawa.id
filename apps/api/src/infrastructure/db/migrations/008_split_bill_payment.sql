-- Split bill (1 order → N customer bills) and split payment (1 bill paid
-- with multiple tender methods like cash + QRIS).
-- Existing `payments(order_id, amount, method, status)` is reused; we just
-- link it to a split so reconciliation stays accurate per customer.

CREATE TABLE IF NOT EXISTS order_splits (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  label VARCHAR(80),
  amount_due NUMERIC(14, 2) NOT NULL CHECK (amount_due >= 0),
  amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'partial', 'paid', 'void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_splits_order ON order_splits(order_id);

-- Allow payments to optionally attach to a specific split (else the payment
-- applies to the whole order, covering the single-customer case).
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS split_id UUID REFERENCES order_splits(id);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS reference VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_split ON payments(split_id);
