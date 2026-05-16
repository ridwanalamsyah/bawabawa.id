-- Manual order entry support.
--
-- Two changes wired in by this migration:
--
-- 1. `source_channel` records WHERE an order originated (web checkout,
--    Instagram DM, WhatsApp, phone call, walk-in, etc). Defaults to
--    'web' so existing rows and ordinary checkout flows keep their
--    semantics untouched.
--
-- 2. `notes` lets the admin attach free-form context when typing in an
--    order they received off-platform ("DM: minta packing dobel
--    bubblewrap; bayar transfer manual ke BCA"). Nullable.
--
-- The admin manual-order form takes a customer name + phone instead of
-- an existing customer UUID. To support that without sprinkling
-- conditionals through OrdersService, we ALSO loosen the customer
-- record creation path: a separate index on `customers(phone)` lets us
-- look up returning manual customers cheaply.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source_channel VARCHAR(20) NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_source_channel ON orders(source_channel);
CREATE INDEX IF NOT EXISTS idx_orders_branch_channel_created
  ON orders(branch_id, source_channel, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
