-- Shipping integration. Each row represents one shipment booked with a
-- 3PL provider (BiteShip first; the schema is provider-agnostic to add
-- RajaOngkir/SiCepat/etc. later).

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL,           -- "biteship" / future "rajaongkir"
  external_id VARCHAR(120),                -- provider's order id
  courier_company VARCHAR(60) NOT NULL,    -- "jne" / "jnt" / "sicepat"
  courier_type VARCHAR(60) NOT NULL,       -- "reg" / "yes" / "ekonomis"
  waybill_id VARCHAR(120),                 -- AWB / resi (after pickup)
  status VARCHAR(40) NOT NULL DEFAULT 'pending',  -- pending/confirmed/picked/in_transit/delivered/cancelled
  price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  weight_grams INTEGER,
  origin_address TEXT,
  destination_address TEXT,
  raw_payload TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);

-- One external_id per provider is unique so duplicate webhook deliveries
-- can be deduped at the row level (not just at the status update level).
CREATE UNIQUE INDEX IF NOT EXISTS uq_shipments_provider_external
  ON shipments(provider, external_id)
  WHERE provider IS NOT NULL AND external_id IS NOT NULL;
