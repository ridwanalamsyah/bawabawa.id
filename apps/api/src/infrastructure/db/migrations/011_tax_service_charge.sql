-- Tax (PPN) + service charge support on orders.
--
-- Indonesian retail: PPN 11% on subtotal (post-discount).
-- Indonesian F&B: 5-10% service charge on subtotal, then PPN 11% on the
-- (subtotal + service_charge). Convention: tax applies to the service
-- charge, not the other way around.
--
-- Stored as an absolute amount in Rupiah, not a rate, so historical orders
-- remain stable when the default tax rate is changed later.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_charge_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(6, 4) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_charge_rate NUMERIC(6, 4) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: for existing orders, treat `total_amount` as the subtotal since
-- they pre-date the tax/service columns. This keeps totals consistent.
UPDATE orders SET subtotal = total_amount WHERE subtotal = 0 AND total_amount > 0;
