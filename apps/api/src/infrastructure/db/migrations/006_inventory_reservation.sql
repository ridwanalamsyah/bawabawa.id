-- Inventory reservation: physical stock stays in `products.current_stock`,
-- and committed-but-not-yet-shipped stock is tracked in `reserved_stock` so
-- available = current_stock - reserved_stock. Reservations per order go into
-- a dedicated table so we can release/consume idempotently per order.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS reserved_stock INTEGER NOT NULL DEFAULT 0
    CHECK (reserved_stock >= 0);

CREATE TABLE IF NOT EXISTS order_reservations (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'consumed', 'released')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_order_reservations_order
  ON order_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_reservations_product_status
  ON order_reservations(product_id, status);
