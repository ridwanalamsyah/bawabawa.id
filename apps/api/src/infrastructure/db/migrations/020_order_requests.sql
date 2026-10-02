-- Customer order requests from the public site (jastip flow).
--
-- Until now /request only saved the order in the visitor's localStorage, so
-- the team never saw it. Every submission now lands here first:
--
--   submitted  → team checks stock/price          (customer waits)
--   quoted     → team sent the final price         (customer approves)
--   approved   → customer accepted, awaiting payment
--   paid       → payment confirmed
--   purchasing → shopper is buying the items
--   packed     → weighed & packed
--   shipped    → handed to courier / trip (tracking_number)
--   delivered  → received
--   cancelled  → by customer or team
--
-- Catalog checkouts (fixed price) skip `quoted` and start at `approved`.
-- `tracking_token` is a 32-char random secret: knowing it is what lets a
-- guest view their order from any device, so it is never listed publicly.

CREATE TABLE IF NOT EXISTS order_requests (
  id UUID PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  tracking_token VARCHAR(64) UNIQUE NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'request',
  status VARCHAR(30) NOT NULL DEFAULT 'submitted',
  user_id UUID,
  customer_name VARCHAR(160) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  customer_email VARCHAR(180),
  address JSONB NOT NULL,
  tier VARCHAR(10) NOT NULL,
  trip_id UUID,
  items JSONB NOT NULL,
  out_of_stock_preference VARCHAR(20) NOT NULL DEFAULT 'ask',
  customer_notes TEXT,
  estimate JSONB,
  quote JSONB,
  quote_note TEXT,
  payment_method VARCHAR(20),
  tracking_number VARCHAR(80),
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  quoted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_requests_status_created
  ON order_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_requests_user
  ON order_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_requests_phone
  ON order_requests(customer_phone);

-- Refresh-token lookups by user (legacy tokens without `sid`) and cleanup
-- of expired sessions.
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active
  ON user_sessions(user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires
  ON user_sessions(expires_at);

-- /orders/mine filters on created_by.
CREATE INDEX IF NOT EXISTS idx_orders_created_by
  ON orders(created_by, created_at DESC);
