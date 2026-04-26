import { Router } from "express";
import { z } from "zod";
import { authGuard, requirePermission } from "../../common/middleware/auth";
import { CmsService } from "./cms.service";

const cmsRouter = Router();
const service = new CmsService();

const CMS_MANAGE = "cms:manage";

// Authenticated users can read CMS data; only `cms:manage` (or superadmin) can write.
const requireManage = requirePermission(CMS_MANAGE);

// ─────────────────── Settings ───────────────────────────────────────────────
const settingValueSchema = z
  .union([z.record(z.any()), z.array(z.any()), z.null()])
  .optional();

const settingUpsertSchema = z.object({
  value: settingValueSchema,
  description: z.string().max(500).nullable().optional()
});

cmsRouter.get("/settings", authGuard, async (_req, res, next) => {
  try {
    const settings = await service.listSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// Public read for the small subset that's safe to expose without auth (brand,
// SEO defaults). Used by the frontend during boot before login.
cmsRouter.get("/settings/public", async (_req, res, next) => {
  try {
    const all = await service.listSettings();
    const publicKeys = ["brand", "seo", "feature_flags"];
    res.json({
      success: true,
      data: all.filter((s) => publicKeys.includes(s.key))
    });
  } catch (error) {
    next(error);
  }
});

cmsRouter.get("/settings/:key", authGuard, async (req, res, next) => {
  try {
    const setting = await service.getSetting(String(req.params.key));
    if (!setting) {
      res.status(404).json({ success: false, error: { code: "CMS_NOT_FOUND", message: "Setting tidak ditemukan" } });
      return;
    }
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
});

cmsRouter.put(
  "/settings/:key",
  authGuard,
  requireManage,
  async (req, res, next) => {
    try {
      const body = settingUpsertSchema.parse(req.body);
      const result = await service.upsertSetting(
        String(req.params.key),
        body.value ?? {},
        body.description ?? null,
        req.user?.sub ?? null
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────── Pages ──────────────────────────────────────────────────
const pageSchema = z.object({
  slug: z.string().min(1).max(180).regex(/^[a-z0-9-/_]+$/i, "Slug hanya boleh huruf/angka/-/_"),
  title: z.string().min(1).max(240),
  content: z.record(z.any()).default({}),
  metaTitle: z.string().max(240).nullable().optional(),
  metaDescription: z.string().max(2000).nullable().optional(),
  ogImage: z.string().url().nullable().optional(),
  isPublished: z.boolean().optional()
});

cmsRouter.get("/pages", authGuard, async (req, res, next) => {
  try {
    const publishedOnly = req.query.published === "true";
    const pages = await service.listPages({ publishedOnly });
    res.json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
});

// Public-by-slug view of published pages.
cmsRouter.get("/pages/public/:slug", async (req, res, next) => {
  try {
    const page = await service.getPageBySlug(String(req.params.slug));
    if (!page || !page.isPublished) {
      res.status(404).json({ success: false, error: { code: "CMS_NOT_FOUND", message: "Page tidak ditemukan" } });
      return;
    }
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
});

cmsRouter.get("/pages/:id", authGuard, async (req, res, next) => {
  try {
    const page = await service.getPageById(String(req.params.id));
    if (!page) {
      res.status(404).json({ success: false, error: { code: "CMS_NOT_FOUND", message: "Page tidak ditemukan" } });
      return;
    }
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
});

cmsRouter.post("/pages", authGuard, requireManage, async (req, res, next) => {
  try {
    const body = pageSchema.parse(req.body);
    const page = await service.createPage(body, req.user?.sub ?? null);
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
});

cmsRouter.put("/pages/:id", authGuard, requireManage, async (req, res, next) => {
  try {
    const body = pageSchema.parse(req.body);
    const page = await service.updatePage(String(req.params.id), body, req.user?.sub ?? null);
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
});

cmsRouter.delete("/pages/:id", authGuard, requireManage, async (req, res, next) => {
  try {
    await service.deletePage(String(req.params.id));
    res.json({ success: true, data: { id: String(req.params.id) } });
  } catch (error) {
    next(error);
  }
});

// ─────────────────── Sections ───────────────────────────────────────────────
const sectionSchema = z.object({
  title: z.string().max(240).nullable().optional(),
  subtitle: z.string().max(240).nullable().optional(),
  body: z.string().max(10000).nullable().optional(),
  ctaText: z.string().max(160).nullable().optional(),
  ctaLink: z.string().max(500).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
});

cmsRouter.get("/sections", authGuard, async (_req, res, next) => {
  try {
    const sections = await service.listSections();
    res.json({ success: true, data: sections });
  } catch (error) {
    next(error);
  }
});

cmsRouter.get("/sections/public", async (_req, res, next) => {
  try {
    const sections = await service.listSections();
    res.json({ success: true, data: sections.filter((s) => s.isActive) });
  } catch (error) {
    next(error);
  }
});

cmsRouter.put(
  "/sections/:key",
  authGuard,
  requireManage,
  async (req, res, next) => {
    try {
      const body = sectionSchema.parse(req.body);
      const section = await service.upsertSection(String(req.params.key), body, req.user?.sub ?? null);
      res.json({ success: true, data: section });
    } catch (error) {
      next(error);
    }
  }
);

cmsRouter.delete(
  "/sections/:key",
  authGuard,
  requireManage,
  async (req, res, next) => {
    try {
      await service.deleteSection(String(req.params.key));
      res.json({ success: true, data: { key: String(req.params.key) } });
    } catch (error) {
      next(error);
    }
  }
);

// ─────────────────── Navigation ─────────────────────────────────────────────
const navSchema = z.object({
  label: z.string().min(1).max(160),
  href: z.string().min(1).max(500),
  parentId: z.string().uuid().nullable().optional(),
  requiredPermission: z.string().max(120).nullable().optional(),
  requiredRole: z.string().max(120).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  isExternal: z.boolean().optional(),
  isActive: z.boolean().optional()
});

const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int().min(0).max(100000)
      })
    )
    .min(1)
});

// Public read for the navbar — anyone can fetch the active nav tree (the
// AppShell still applies permission filtering client-side via usePermission).
cmsRouter.get("/nav", async (_req, res, next) => {
  try {
    const items = await service.listNavItems({ activeOnly: true });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

cmsRouter.get("/nav/all", authGuard, requireManage, async (_req, res, next) => {
  try {
    const items = await service.listNavItems();
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

cmsRouter.post("/nav", authGuard, requireManage, async (req, res, next) => {
  try {
    const body = navSchema.parse(req.body);
    const item = await service.createNavItem(body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

cmsRouter.put("/nav/:id", authGuard, requireManage, async (req, res, next) => {
  try {
    const body = navSchema.parse(req.body);
    const item = await service.updateNavItem(String(req.params.id), body);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

cmsRouter.delete("/nav/:id", authGuard, requireManage, async (req, res, next) => {
  try {
    await service.deleteNavItem(String(req.params.id));
    res.json({ success: true, data: { id: String(req.params.id) } });
  } catch (error) {
    next(error);
  }
});

cmsRouter.post("/nav/reorder", authGuard, requireManage, async (req, res, next) => {
  try {
    const body = reorderSchema.parse(req.body);
    const items = await service.reorderNavItems(body.items);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

// ─────────────────── Media ──────────────────────────────────────────────────
const mediaSchema = z.object({
  filename: z.string().min(1).max(240),
  storagePath: z.string().min(1).max(500),
  publicUrl: z.string().url(),
  mimeType: z.string().max(120).nullable().optional(),
  sizeBytes: z.number().int().min(0).optional(),
  altText: z.string().max(240).nullable().optional()
});

cmsRouter.get("/media", authGuard, async (_req, res, next) => {
  try {
    const items = await service.listMedia();
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

cmsRouter.post("/media", authGuard, requireManage, async (req, res, next) => {
  try {
    const body = mediaSchema.parse(req.body);
    const item = await service.createMedia(body, req.user?.sub ?? null);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

cmsRouter.delete("/media/:id", authGuard, requireManage, async (req, res, next) => {
  try {
    await service.deleteMedia(String(req.params.id));
    res.json({ success: true, data: { id: String(req.params.id) } });
  } catch (error) {
    next(error);
  }
});

export { cmsRouter };
