CREATE TABLE IF NOT EXISTS purchase_order_sources (
  id UUID PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (purchase_order_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_po_sources_order ON purchase_order_sources(order_id);

CREATE TABLE IF NOT EXISTS platform_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (setting_key, setting_value)
VALUES (
  'profit_share',
  '{"rules":[{"owner":"Ridwan","percentage":33},{"owner":"Alya","percentage":33},{"owner":"Belva","percentage":33}],"reservePercentage":1}'
)
ON CONFLICT (setting_key) DO NOTHING;
