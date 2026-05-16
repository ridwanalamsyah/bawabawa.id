import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bawabawa.id";

const STATIC_ROUTES: Array<{ path: string; freq: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
  { path: "/", freq: "daily", priority: 1.0 },
  { path: "/open-trip", freq: "daily", priority: 0.9 },
  { path: "/request", freq: "monthly", priority: 0.9 },
  { path: "/blog", freq: "weekly", priority: 0.7 },
  { path: "/kontak", freq: "yearly", priority: 0.6 },
  { path: "/press-kit", freq: "yearly", priority: 0.5 },
  { path: "/login", freq: "yearly", priority: 0.4 },
  { path: "/privacy", freq: "yearly", priority: 0.3 },
  { path: "/terms", freq: "yearly", priority: 0.3 },
  { path: "/refund", freq: "yearly", priority: 0.3 },
];

const CATEGORY_LANDING: Array<{ slug: string }> = [
  { slug: "jastip-sepatu" },
  { slug: "jastip-skincare" },
  { slug: "jastip-fashion" },
  { slug: "jastip-makanan" },
  { slug: "jastip-elektronik" },
  { slug: "jastip-buku" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...STATIC_ROUTES.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...CATEGORY_LANDING.map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
