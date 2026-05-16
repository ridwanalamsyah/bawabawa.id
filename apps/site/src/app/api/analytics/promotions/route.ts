import { erpSafe } from "@/lib/erp-client";

/**
 * Proxy for the marketing site promotion banner.
 *
 * Returns the (small) list of vouchers the admin has explicitly toggled
 * `is_public = true` on. Source endpoint is `/promotions` in apps/api;
 * if it's unreachable we return an empty array so the banner renders
 * nothing rather than blocking the rest of the page.
 */
type ErpPromotion = {
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  bannerLabel: string | null;
  bannerPriority: number;
  endsAt: string | null;
};

export async function GET() {
  const erp = await erpSafe<ErpPromotion[]>({
    path: "/promotions",
    timeoutMs: 4000,
  });
  if (erp.ok && Array.isArray(erp.data)) {
    return Response.json({ items: erp.data, source: "erp" });
  }
  return Response.json({ items: [], source: "fallback" });
}
