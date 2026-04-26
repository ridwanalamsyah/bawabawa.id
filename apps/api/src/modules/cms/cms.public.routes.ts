import { Router, type Request, type Response, type NextFunction } from "express";
import { CmsService } from "./cms.service";

/**
 * Public-facing, non-versioned endpoints that crawlers expect at the site root.
 * Mounted on the bare express app (not under `/api/v1`) so that
 *   GET https://bawabawa.id/sitemap.xml
 *   GET https://bawabawa.id/robots.txt
 * Just Work™.
 */
export const cmsPublicRouter = Router();

function resolveOrigin(req: Request): string {
  const explicit = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string | undefined) || req.get("host") || "bawabawa.id";
  return `${proto}://${host}`;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

/**
 * Path prefixes that are behind authentication via `ProtectedRoute` on the
 * frontend or are otherwise not safe to index. Kept in lock-step with the
 * `Disallow` list emitted in /robots.txt below — the two MUST agree, otherwise
 * we'd be telling crawlers "don't visit X" while also listing X in the sitemap.
 *
 * `requiredPermission` / `requiredRole` on a nav row only describes coarse RBAC
 * gating; many internal modules (sales, inventory, procurement, crm, hr) have
 * NULL gating in the seed but are still authenticated-only because the SPA
 * route is wrapped in ProtectedRoute. So we filter by path prefix, not by RBAC.
 */
const DISALLOWED_PREFIXES: readonly string[] = [
  "/admin",
  "/api",
  "/login",
  "/dashboard",
  "/orders",
  "/sales",
  "/inventory",
  "/procurement",
  "/finance",
  "/crm",
  "/hr"
] as const;

function isPublicPath(href: string): boolean {
  if (!href.startsWith("/")) return false;
  for (const prefix of DISALLOWED_PREFIXES) {
    if (href === prefix || href.startsWith(prefix + "/")) return false;
  }
  return true;
}

cmsPublicRouter.get("/sitemap.xml", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const svc = new CmsService();
    const origin = resolveOrigin(req);
    const pages = await svc.listPages();
    const navItems = await svc.listNavItems();

    const urls: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[] = [];
    const seen = new Set<string>();
    const push = (entry: { loc: string; lastmod?: string; changefreq?: string; priority?: string }) => {
      if (seen.has(entry.loc)) return;
      seen.add(entry.loc);
      urls.push(entry);
    };

    push({ loc: origin + "/", changefreq: "weekly", priority: "1.0" });

    for (const item of navItems) {
      if (!item.isActive || item.isExternal) continue;
      // Don't index authenticated or admin/api routes (see DISALLOWED_PREFIXES).
      if (item.requiredPermission || item.requiredRole) continue;
      if (!isPublicPath(item.href)) continue;
      push({ loc: origin + item.href, changefreq: "weekly", priority: "0.7" });
    }

    for (const page of pages) {
      if (!page.isPublished) continue;
      const path = "/" + page.slug.replace(/^\//, "");
      if (!isPublicPath(path)) continue;
      push({
        loc: origin + path,
        lastmod: page.updatedAt ? new Date(page.updatedAt).toISOString() : undefined,
        changefreq: "monthly",
        priority: "0.6"
      });
    }

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map((u) => {
          const parts = [`    <loc>${escapeXml(u.loc)}</loc>`];
          if (u.lastmod) parts.push(`    <lastmod>${escapeXml(u.lastmod)}</lastmod>`);
          if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
          if (u.priority) parts.push(`    <priority>${u.priority}</priority>`);
          return `  <url>\n${parts.join("\n")}\n  </url>`;
        })
        .join("\n") +
      `\n</urlset>\n`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=600");
    res.send(body);
  } catch (error) {
    next(error);
  }
});

cmsPublicRouter.get("/robots.txt", (req: Request, res: Response) => {
  const origin = resolveOrigin(req);
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...DISALLOWED_PREFIXES.map((prefix) => `Disallow: ${prefix}`),
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    ""
  ];
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(lines.join("\n"));
});
