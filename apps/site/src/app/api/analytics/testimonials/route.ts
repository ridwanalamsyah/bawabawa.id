import { erpSafe } from "@/lib/erp-client";

type ErpTestimonial = {
  id: string;
  customer_name: string;
  city: string | null;
  rating: number;
  body: string;
  avatar_url: string | null;
  is_verified: boolean;
};

/**
 * Admin-curated testimonials. ERP returns only entries flagged
 * `is_published = TRUE`. Until the admin CMS for testimonials lands, this
 * is expected to return an empty array — the UI renders the honest
 * "Belum ada review" empty state.
 */
export async function GET() {
  const erp = await erpSafe<ErpTestimonial[]>({
    path: "/reports/testimonials",
    timeoutMs: 4000,
  });
  if (erp.ok && Array.isArray(erp.data)) {
    return Response.json({ items: erp.data, source: "erp" });
  }
  return Response.json({ items: [], source: "fallback" });
}
