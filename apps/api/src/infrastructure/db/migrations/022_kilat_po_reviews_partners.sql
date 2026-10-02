-- 1. PO batch cutoff per Open Trip. Cargo (batch) orders for a trip are
--    refused after po_closes_at so the team can shop, pack and hand over in
--    time. NULL = no cutoff (legacy trips).
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS po_closes_at TIMESTAMPTZ;

-- 2. How the parcel reaches the customer in Samarinda: home delivery or
--    pickup at the team's pickup point (cheaper last mile).
ALTER TABLE order_requests
  ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(10) NOT NULL DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ;

-- 3. Customer reviews. One per delivered order request; unpublished until
--    the team approves it. (reports/testimonials already reads this table,
--    which previously only existed in the test DDL.)
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY,
  order_request_id UUID UNIQUE,
  customer_name TEXT NOT NULL,
  city TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  avatar_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS order_request_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_order_request
  ON testimonials(order_request_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_published
  ON testimonials(is_published, published_at DESC);

-- 4. Reseller / B2B / affiliate enquiries from the public site.
CREATE TABLE IF NOT EXISTS partner_inquiries (
  id UUID PRIMARY KEY,
  kind VARCHAR(20) NOT NULL,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  business_name VARCHAR(160),
  city VARCHAR(80),
  categories TEXT,
  monthly_volume_kg INTEGER,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_status_created
  ON partner_inquiries(status, created_at DESC);
