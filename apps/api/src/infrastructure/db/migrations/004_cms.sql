-- =============================================================================
-- CMS / zero-hardcode tables
-- All site copy, branding, navigation, and structured content is editable from
-- the admin panel without touching code. Pairs with `cms:read` (any
-- authenticated user) and `cms:manage` (superadmin / users:manage_users role).
-- =============================================================================

-- Global key/value site settings (brand, contact, social, theme, ...).
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(120) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Standalone CMS pages (about / contact / terms / etc).
CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY,
  slug VARCHAR(180) UNIQUE NOT NULL,
  title VARCHAR(240) NOT NULL,
  -- Rich text body stored as Tiptap JSON document.
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta_title VARCHAR(240),
  meta_description TEXT,
  og_image TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_published
  ON cms_pages(is_published) WHERE is_published = TRUE;

-- Reusable structured sections (hero, feature blocks, CTA banners, ...) keyed
-- by a stable section_key referenced from the frontend.
CREATE TABLE IF NOT EXISTS cms_sections (
  id UUID PRIMARY KEY,
  section_key VARCHAR(120) UNIQUE NOT NULL,
  title VARCHAR(240),
  subtitle VARCHAR(240),
  body TEXT,
  cta_text VARCHAR(160),
  cta_link VARCHAR(500),
  image_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Editable navigation tree (label/href/order/parent + permission gating).
CREATE TABLE IF NOT EXISTS cms_nav_items (
  id UUID PRIMARY KEY,
  label VARCHAR(160) NOT NULL,
  href VARCHAR(500) NOT NULL,
  parent_id UUID REFERENCES cms_nav_items(id) ON DELETE CASCADE,
  -- Optional permission/role gate, evaluated client-side via usePermission().
  required_permission VARCHAR(120),
  required_role VARCHAR(120),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_external BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_nav_items_order
  ON cms_nav_items(parent_id, sort_order, label);

-- Media library entries (Supabase-storage compatible shape, but works with any
-- backend that exposes a public URL).
CREATE TABLE IF NOT EXISTS cms_media (
  id UUID PRIMARY KEY,
  filename VARCHAR(240) NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  mime_type VARCHAR(120),
  size_bytes BIGINT NOT NULL DEFAULT 0,
  alt_text VARCHAR(240),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_media_created
  ON cms_media(created_at DESC);

-- =============================================================================
-- Seed defaults: brand identity, contact, social links, default nav.
-- Uses ON CONFLICT DO NOTHING so re-running is idempotent.
-- =============================================================================

INSERT INTO site_settings (setting_key, value, description)
VALUES
  ('brand', $$
    {
      "name": "bawabawa.id",
      "shortName": "bawabawa.id",
      "tagline": "Sistem Manajemen Bisnis Terpadu",
      "monogram": "BW",
      "logoUrl": null,
      "primaryColor": "#6366f1",
      "accentColor": "#8b5cf6"
    }
  $$::jsonb, 'Brand identity (name, monogram, colors).'),
  ('contact', $$
    {
      "email": "halo@bawabawa.id",
      "phone": "+62 812-0000-0000",
      "address": "Jakarta, Indonesia",
      "supportHours": "Senin – Jumat · 09:00 – 18:00 WIB"
    }
  $$::jsonb, 'Public contact information.'),
  ('social', $$
    {
      "instagram": "https://instagram.com/bawabawa.id",
      "linkedin": "https://www.linkedin.com/company/bawabawa-id",
      "twitter": null,
      "youtube": null
    }
  $$::jsonb, 'Public social profile links.'),
  ('seo', $$
    {
      "defaultTitle": "bawabawa.id — Enterprise Resource Planning",
      "defaultDescription": "Platform ERP modular untuk operasi sales, finance, inventory, procurement, dan HR di satu kanvas.",
      "ogImage": null,
      "twitterCard": "summary_large_image"
    }
  $$::jsonb, 'Defaults for <head> meta tags and Open Graph.'),
  ('feature_flags', $$
    {
      "enableDarkMode": true,
      "enableMobileMenu": true,
      "showWelcomeToast": true
    }
  $$::jsonb, 'Runtime feature flags.')
ON CONFLICT (setting_key) DO NOTHING;

-- Default top-level navigation that mirrors the previous hardcoded DEFAULT_NAV
-- in AppShell.tsx. Once this lands, the AppShell reads from this table and the
-- old constant becomes a fallback only.
INSERT INTO cms_nav_items (id, label, href, parent_id, required_permission, sort_order, is_external, is_active)
VALUES
  (gen_random_uuid(), 'Dashboard',   '/',            NULL, NULL,                    10, FALSE, TRUE),
  (gen_random_uuid(), 'Sales',       '/sales',       NULL, NULL,                    20, FALSE, TRUE),
  (gen_random_uuid(), 'Orders',      '/orders',      NULL, 'orders:read',           30, FALSE, TRUE),
  (gen_random_uuid(), 'Inventory',   '/inventory',   NULL, NULL,                    40, FALSE, TRUE),
  (gen_random_uuid(), 'Procurement', '/procurement', NULL, NULL,                    50, FALSE, TRUE),
  (gen_random_uuid(), 'Finance',     '/finance',     NULL, 'finance:manage_finance',60, FALSE, TRUE),
  (gen_random_uuid(), 'CRM',         '/crm',         NULL, NULL,                    70, FALSE, TRUE),
  (gen_random_uuid(), 'HR',          '/hr',          NULL, NULL,                    80, FALSE, TRUE),
  (gen_random_uuid(), 'Admin',       '/admin',       NULL, 'users:manage_users',    90, FALSE, TRUE)
ON CONFLICT DO NOTHING;
