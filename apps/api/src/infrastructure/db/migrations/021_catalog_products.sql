-- Catalog fields on products so the public site can sell popular items at
-- a fixed, all-in price (e.g. "Snack khas Bandung" for the next trip)
-- instead of making every customer type a free-form request.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS origin_store VARCHAR(120),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS catalog_category VARCHAR(60),
  ADD COLUMN IF NOT EXISTS variants JSONB,
  ADD COLUMN IF NOT EXISTS trip_id UUID,
  ADD COLUMN IF NOT EXISTS is_catalog BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS catalog_sort INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_catalog
  ON products(is_catalog, catalog_category, catalog_sort);
