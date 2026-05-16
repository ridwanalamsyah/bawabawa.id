-- Admin-managed blog posts.
--
-- Until now blog post content was hardcoded in the marketing app
-- (apps/site/src/app/(marketing)/blog/[slug]/page.tsx as a giant
-- object literal). Adding a post = deploying the site. This migration
-- adds a DB-backed posts table so the admin can add/edit posts from
-- the ERP without a deploy.
--
-- Content is stored as Markdown (`content_md`). Rendering happens
-- server-side on the marketing app when the post page loads. The
-- hardcoded posts in the site code remain as a fallback for the
-- soft-launch period (if the API returns nothing, the existing
-- in-page constants are used).

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  title VARCHAR(240) NOT NULL,
  excerpt VARCHAR(500),
  content_md TEXT NOT NULL,
  category VARCHAR(80),
  read_time VARCHAR(20),
  hero_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON blog_posts(is_published, published_at DESC)
  WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
