-- Public voucher banner support.
--
-- Until now `vouchers.is_active` did double duty: it gated _redemption_
-- and was the only signal we had for "should this be promoted". The
-- admin needs to be able to:
--
--   1. Run a voucher quietly (active, redeemable by customers who know
--      the code, but NOT shown on the public landing page banner).
--      e.g. retention vouchers DM'd to specific customers.
--
--   2. Promote a voucher publicly with a custom label.
--      e.g. code 'BAWA50' with label "Diskon Rp 50.000 untuk 50 customer pertama".
--
-- Two new columns:
--
--   * is_public        — toggle this on to surface in /reports/promotions.
--   * banner_label     — the human-friendly headline shown on the site.
--                        If null, the public endpoint falls back to the
--                        voucher.description, then to a generated string.
--   * banner_priority  — higher = sorted first when multiple vouchers
--                        are public at once.

ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS banner_label VARCHAR(120),
  ADD COLUMN IF NOT EXISTS banner_priority INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_vouchers_public_active
  ON vouchers(is_public, is_active)
  WHERE is_public = TRUE AND is_active = TRUE;
