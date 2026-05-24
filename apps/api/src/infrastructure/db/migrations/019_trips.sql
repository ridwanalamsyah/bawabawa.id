-- Admin-curated Open Trip schedule.
--
-- Replaces hardcoded mock trips on the marketing /open-trip page with rows
-- owned by an admin. Workflow:
--   1. Admin creates a trip (draft) via /admin/trips.
--   2. Admin publishes it -> appears on public /open-trip immediately.
--   3. Admin can update capacity_kg / booked_kg as new orders confirm.
--   4. Admin can close a trip (status='closed') to hide from the listing.

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY,
  code VARCHAR(40) UNIQUE NOT NULL,
  origin VARCHAR(80) NOT NULL,
  destination VARCHAR(80) NOT NULL,
  depart_at TIMESTAMPTZ NOT NULL,
  arrive_estimate_at TIMESTAMPTZ,
  capacity_kg INTEGER NOT NULL CHECK (capacity_kg >= 0),
  booked_kg INTEGER NOT NULL DEFAULT 0 CHECK (booked_kg >= 0),
  base_fee NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (base_fee >= 0),
  per_kg_fee NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (per_kg_fee >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  popular_categories JSONB,
  notes TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_published_depart
  ON trips(is_published, depart_at);

CREATE INDEX IF NOT EXISTS idx_trips_status
  ON trips(status);
