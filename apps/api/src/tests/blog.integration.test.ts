import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { getPool } from "../infrastructure/db/pool";
import { ensureSchema, hasPostgres, resetData } from "./helpers/db-setup";

/**
 * PR #52 — admin-managed blog posts.
 *
 * Surfaces under test:
 *   • Public:
 *       GET  /api/v1/blog-posts           list of PUBLISHED only
 *       GET  /api/v1/blog-posts/:slug     single post, returns null for
 *                                          unknown/unpublished (so the
 *                                          marketing site can fall back
 *                                          to the hardcoded catalog).
 *   • Admin (cms:manage):
 *       GET  /api/v1/admin/blog-posts     list ALL (including drafts)
 *       POST /api/v1/admin/blog-posts     create (slug, title, content_md
 *                                          required; markdown body 20..40000)
 *       PATCH /api/v1/admin/blog-posts/:slug   partial update + publish toggle
 *
 * Public endpoints must NEVER 5xx — the marketing site reads them at
 * first paint, so missing tables or empty data degrade to [].
 */
describe.skipIf(!hasPostgres)("blog endpoints (PR #52)", () => {
  const ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ?? "test-JWT_ACCESS_SECRET";

  function signToken(perms = ["cms:manage"]) {
    return jwt.sign(
      { sub: randomUUID(), roles: ["admin"], permissions: perms },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );
  }

  function uniqueSlug(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }

  beforeAll(async () => {
    await ensureSchema();
  });

  beforeEach(async () => {
    await resetData();
  });

  it("public GET /blog-posts returns [] when nothing published, no auth required", async () => {
    const res = await request(createApp()).get("/api/v1/blog-posts");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("public GET /blog-posts/:slug returns null (not 404) for unknown slug", async () => {
    const res = await request(createApp()).get(
      "/api/v1/blog-posts/this-slug-does-not-exist"
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Null lets the marketing site fall back to its hardcoded catalog.
    expect(res.body.data).toBeNull();
  });

  it("admin POST /admin/blog-posts requires auth (401 without bearer token)", async () => {
    const res = await request(createApp())
      .post("/api/v1/admin/blog-posts")
      .send({
        slug: uniqueSlug("noauth"),
        title: "no auth post",
        contentMd: "a".repeat(50)
      });
    expect(res.status).toBe(401);
  });

  it("admin POST /admin/blog-posts requires cms:manage permission (403)", async () => {
    const token = signToken(["unrelated:read"]);
    const res = await request(createApp())
      .post("/api/v1/admin/blog-posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        slug: uniqueSlug("noperm"),
        title: "no perm post",
        contentMd: "a".repeat(50)
      });
    expect(res.status).toBe(403);
  });

  it("admin POST rejects malformed slugs (uppercase / spaces)", async () => {
    const token = signToken();
    const res = await request(createApp())
      .post("/api/v1/admin/blog-posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        slug: "Not A Valid Slug!",
        title: "bad slug post",
        contentMd: "a".repeat(50)
      });
    // Zod regex rejection — either 400 or 422 depending on handler.
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("admin POST rejects too-short content (markdown body must be >= 20 chars)", async () => {
    const token = signToken();
    const res = await request(createApp())
      .post("/api/v1/admin/blog-posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        slug: uniqueSlug("short"),
        title: "too short",
        contentMd: "hi"
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("end-to-end: admin can create a draft, public cannot see it, then publish makes it visible", async () => {
    const token = signToken();
    const slug = uniqueSlug("e2e");

    // 1. Create as DRAFT (isPublished omitted → defaults to undefined →
    //    persisted as FALSE).
    const create = await request(createApp())
      .post("/api/v1/admin/blog-posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        slug,
        title: "Draft Post",
        excerpt: "Excerpt under 500",
        contentMd: "# Heading\n\nMarkdown body content here, definitely more than twenty characters.",
        category: "Operasional",
        readTime: "3 min"
      });
    expect(create.status).toBe(201);
    expect(create.body.data.slug).toBe(slug);

    // 2. Public list MUST NOT contain the draft.
    const publicList1 = await request(createApp()).get("/api/v1/blog-posts");
    const present1 = publicList1.body.data.some((p: { slug: string }) => p.slug === slug);
    expect(present1).toBe(false);

    // 3. Public detail returns null for unpublished slug.
    const detail1 = await request(createApp()).get(`/api/v1/blog-posts/${slug}`);
    expect(detail1.body.data).toBeNull();

    // 4. Admin can fetch it via the admin list (which returns drafts).
    const adminList = await request(createApp())
      .get("/api/v1/admin/blog-posts")
      .set("Authorization", `Bearer ${token}`);
    expect(adminList.status).toBe(200);
    const adminFound = adminList.body.data.find((p: { slug: string }) => p.slug === slug);
    expect(adminFound).toBeDefined();
    expect(adminFound.isPublished).toBeFalsy();

    // 5. Publish via PATCH.
    const patch = await request(createApp())
      .patch(`/api/v1/admin/blog-posts/${slug}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isPublished: true });
    expect(patch.status).toBe(200);

    // 6. Public list NOW contains it.
    const publicList2 = await request(createApp()).get("/api/v1/blog-posts");
    const present2 = publicList2.body.data.some((p: { slug: string }) => p.slug === slug);
    expect(present2).toBe(true);

    // 7. Public detail returns the post body.
    const detail2 = await request(createApp()).get(`/api/v1/blog-posts/${slug}`);
    expect(detail2.body.data?.slug).toBe(slug);
    expect(detail2.body.data?.title).toBe("Draft Post");
    expect(detail2.body.data?.contentMd).toContain("Markdown body content here");
  });

  it("admin POST rejects duplicate slug with 409 BLOG_POST_SLUG_TAKEN", async () => {
    const token = signToken();
    const slug = uniqueSlug("dup");
    const first = await request(createApp())
      .post("/api/v1/admin/blog-posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        slug,
        title: "First",
        contentMd: "a".repeat(50)
      });
    expect(first.status).toBe(201);

    const dup = await request(createApp())
      .post("/api/v1/admin/blog-posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        slug,
        title: "Second with same slug",
        contentMd: "a".repeat(50)
      });
    expect(dup.status).toBe(409);
    expect(dup.body.error?.code).toBe("BLOG_POST_SLUG_TAKEN");
  });
});
