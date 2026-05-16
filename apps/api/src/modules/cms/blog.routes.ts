import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { logAudit } from "../../common/audit/audit-log";
import { getPool } from "../../infrastructure/db/pool";
import { AppError } from "../../common/errors/app-error";

/**
 * Blog post routes split into two routers:
 *   - publicBlogRouter: unauthenticated GETs of published posts. Mounted
 *     at `/blog-posts`. Used by the marketing site.
 *   - adminBlogRouter: authed CRUD. Mounted at `/admin/blog-posts`.
 *     Requires the `cms:manage` permission, the same gate used for
 *     editing pages and settings.
 */

const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

type Row = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  category: string | null;
  read_time: string | null;
  hero_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToDto(row: Row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    contentMd: row.content_md,
    category: row.category,
    readTime: row.read_time,
    heroImageUrl: row.hero_image_url,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ─── Public ─────────────────────────────────────────────────────────────────
export const publicBlogRouter = Router();

publicBlogRouter.get("/", async (_req, res) => {
  try {
    const db = await getPool();
    const result = await db.query<Row>(
      `SELECT id, slug, title, excerpt, content_md, category, read_time,
              hero_image_url, is_published, published_at, created_at, updated_at
         FROM blog_posts
        WHERE is_published = TRUE
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT 50`
    );
    res.json({ success: true, data: result.rows.map(rowToDto) });
  } catch {
    // Marketing site reads this — never 5xx, just degrade to empty.
    res.json({ success: true, data: [] });
  }
});

publicBlogRouter.get("/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug);
    const db = await getPool();
    const result = await db.query<Row>(
      `SELECT id, slug, title, excerpt, content_md, category, read_time,
              hero_image_url, is_published, published_at, created_at, updated_at
         FROM blog_posts
        WHERE slug = $1 AND is_published = TRUE`,
      [slug]
    );
    if (!result.rowCount) {
      // Don't 5xx — return null so the site can fall back to its
      // hardcoded post catalog.
      res.json({ success: true, data: null });
      return;
    }
    res.json({ success: true, data: rowToDto(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

// ─── Admin ──────────────────────────────────────────────────────────────────
export const adminBlogRouter = Router();

const blogPostInput = z.object({
  slug: z
    .string()
    .min(3)
    .max(160)
    .regex(slugRegex, "Slug hanya boleh huruf-kecil, angka, dan tanda hubung"),
  title: z.string().min(3).max(240),
  excerpt: z.string().max(500).nullable().optional(),
  contentMd: z.string().min(20).max(40000),
  category: z.string().max(80).nullable().optional(),
  readTime: z.string().max(20).nullable().optional(),
  heroImageUrl: z.string().url().max(1000).nullable().optional(),
  isPublished: z.boolean().optional()
});

const blogPostPatchInput = blogPostInput.partial();

adminBlogRouter.get(
  "/",
  authGuard,
  requirePermission("cms:manage"),
  async (_req, res, next) => {
    try {
      const db = await getPool();
      const result = await db.query<Row>(
        `SELECT id, slug, title, excerpt, content_md, category, read_time,
                hero_image_url, is_published, published_at, created_at, updated_at
           FROM blog_posts ORDER BY created_at DESC LIMIT 200`
      );
      res.json({ success: true, data: result.rows.map(rowToDto) });
    } catch (err) {
      next(err);
    }
  }
);

adminBlogRouter.get(
  "/:slug",
  authGuard,
  requirePermission("cms:manage"),
  async (req, res, next) => {
    try {
      const db = await getPool();
      const result = await db.query<Row>(
        `SELECT id, slug, title, excerpt, content_md, category, read_time,
                hero_image_url, is_published, published_at, created_at, updated_at
           FROM blog_posts WHERE slug = $1`,
        [String(req.params.slug)]
      );
      if (!result.rowCount) {
        throw new AppError(404, "BLOG_POST_NOT_FOUND", "Post tidak ditemukan");
      }
      res.json({ success: true, data: rowToDto(result.rows[0]) });
    } catch (err) {
      next(err);
    }
  }
);

adminBlogRouter.post(
  "/",
  authGuard,
  requirePermission("cms:manage"),
  (req, res, next) => {
    blogPostInput
      .parseAsync(req.body)
      .then(async (input) => {
        const id = randomUUID();
        const publishedAt =
          input.isPublished === true ? new Date().toISOString() : null;
        const db = await getPool();
        try {
          await db.query(
            `INSERT INTO blog_posts
              (id, slug, title, excerpt, content_md, category, read_time,
               hero_image_url, is_published, published_at, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
              id,
              input.slug,
              input.title,
              input.excerpt ?? null,
              input.contentMd,
              input.category ?? null,
              input.readTime ?? null,
              input.heroImageUrl ?? null,
              input.isPublished === true,
              publishedAt,
              req.user?.sub ?? null
            ]
          );
        } catch (err) {
          if (err instanceof Error && /duplicate key/i.test(err.message)) {
            throw new AppError(
              409,
              "BLOG_POST_SLUG_TAKEN",
              "Slug sudah dipakai"
            );
          }
          throw err;
        }
        await logAudit({
          actorId: req.user?.sub,
          action: "blog.create",
          moduleName: "cms",
          entityId: id,
          afterData: { slug: input.slug, isPublished: input.isPublished === true }
        });
        res.status(201).json({ success: true, data: { id, slug: input.slug } });
      })
      .catch(next);
  }
);

adminBlogRouter.patch(
  "/:slug",
  authGuard,
  requirePermission("cms:manage"),
  (req, res, next) => {
    blogPostPatchInput
      .parseAsync(req.body)
      .then(async (input) => {
        const slug = String(req.params.slug);
        const sets: string[] = ["updated_at = NOW()"];
        const values: unknown[] = [];
        const push = (col: string, value: unknown) => {
          values.push(value);
          sets.push(`${col} = $${values.length}`);
        };
        if (input.title !== undefined) push("title", input.title);
        if (input.excerpt !== undefined) push("excerpt", input.excerpt);
        if (input.contentMd !== undefined) push("content_md", input.contentMd);
        if (input.category !== undefined) push("category", input.category);
        if (input.readTime !== undefined) push("read_time", input.readTime);
        if (input.heroImageUrl !== undefined) push("hero_image_url", input.heroImageUrl);
        if (input.isPublished !== undefined) {
          push("is_published", input.isPublished);
          if (input.isPublished) {
            push("published_at", new Date().toISOString());
          }
        }
        if (input.slug !== undefined && input.slug !== slug) {
          push("slug", input.slug);
        }
        if (values.length === 0) {
          throw new AppError(422, "NO_FIELDS", "Tidak ada field yang diubah");
        }
        values.push(slug);
        const db = await getPool();
        const result = await db.query<{ id: string }>(
          `UPDATE blog_posts SET ${sets.join(", ")} WHERE slug = $${values.length} RETURNING id`,
          values
        );
        if (!result.rowCount) {
          throw new AppError(404, "BLOG_POST_NOT_FOUND", "Post tidak ditemukan");
        }
        await logAudit({
          actorId: req.user?.sub,
          action: "blog.update",
          moduleName: "cms",
          entityId: result.rows[0].id,
          afterData: input
        });
        res.json({ success: true, data: { id: result.rows[0].id } });
      })
      .catch(next);
  }
);

adminBlogRouter.delete(
  "/:slug",
  authGuard,
  requirePermission("cms:manage"),
  async (req, res, next) => {
    try {
      const slug = String(req.params.slug);
      const db = await getPool();
      const result = await db.query<{ id: string }>(
        `DELETE FROM blog_posts WHERE slug = $1 RETURNING id`,
        [slug]
      );
      if (!result.rowCount) {
        throw new AppError(404, "BLOG_POST_NOT_FOUND", "Post tidak ditemukan");
      }
      await logAudit({
        actorId: req.user?.sub,
        action: "blog.delete",
        moduleName: "cms",
        entityId: result.rows[0].id
      });
      res.json({ success: true, data: { id: result.rows[0].id } });
    } catch (err) {
      next(err);
    }
  }
);
