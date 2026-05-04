-- Discount & voucher engine. Supports two shapes:
--   * percentage (e.g. 10% off, capped by `max_discount`)
--   * fixed amount (e.g. Rp 50.000 off)
--
-- Each voucher carries validity window, usage quotas (total + per-user),
-- and a minimum order threshold. Redemptions are recorded in
-- `voucher_redemptions` so we can enforce per-user limits and audit trails.

CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  description VARCHAR(200),
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(14, 2) NOT NULL CHECK (discount_value > 0),
  max_discount NUMERIC(14, 2),
  min_order_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  max_uses INTEGER,
  per_user_limit INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(is_active);

CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id UUID PRIMARY KEY,
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  discount_applied NUMERIC(14, 2) NOT NULL CHECK (discount_applied >= 0),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher ON voucher_redemptions(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_order ON voucher_redemptions(order_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_customer ON voucher_redemptions(customer_id);
