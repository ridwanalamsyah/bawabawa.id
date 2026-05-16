import { erpSafe } from "@/lib/erp-client";

/**
 * Proxy for the marketing site blog index page.
 *
 * Returns posts the admin has published from the ERP. The marketing
 * site merges these with its hand-curated hardcoded posts at render
 * time so the in-page catalog remains the canonical baseline.
 */
type ErpBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  contentMd: string;
  category: string | null;
  readTime: string | null;
  heroImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function GET() {
  const erp = await erpSafe<ErpBlogPost[]>({
    path: "/blog-posts",
    timeoutMs: 4000,
  });
  if (erp.ok && Array.isArray(erp.data)) {
    return Response.json({ items: erp.data, source: "erp" });
  }
  return Response.json({ items: [], source: "fallback" });
}
