import { erpSafe } from "@/lib/erp-client";

/**
 * Public CMS settings — brand, SEO defaults, feature flags. Editable in the
 * ERP at /api/v1/cms/settings (auth required) and exposed on the public path
 * /api/v1/cms/settings/public (no auth). The site fetches this once per
 * request with a short revalidation window so editorial changes propagate
 * within ~1 minute, or instantly via `cms.settings_updated` webhook.
 */
export async function GET() {
  const erp = await erpSafe<Array<{ key: string; value: unknown }>>({
    path: "/cms/settings/public",
    timeoutMs: 3000,
    cache: "force-cache",
    next: { revalidate: 60, tags: ["cms-public"] },
  });
  if (erp.ok) {
    return Response.json({ data: erp.data, source: "erp" });
  }
  // Fallback default brand for marketing previews when the ERP is offline.
  return Response.json({
    source: "fallback",
    data: [
      {
        key: "brand",
        value: {
          name: "Bawabawa.id",
          tagline: "Titip barang Bandung → Samarinda",
          accent: "#7c9885",
          accent2: "#d4a373",
        },
      },
      {
        key: "seo",
        value: {
          title: "Bawabawa.id — Jasa Titip Premium Bandung ke Samarinda",
          description:
            "Personal shopper terverifikasi, tracking realtime, pengiriman aman door-to-door.",
        },
      },
      {
        key: "feature_flags",
        value: { open_trip_v2: true, wishlist: true, live_chat: true },
      },
    ],
  });
}
