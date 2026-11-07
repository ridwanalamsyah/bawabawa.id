import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { VIRAL_BANDUNG_BLOGS } from "@/lib/viral-bandung-data";

export const metadata: Metadata = {
  title: "Cerita & Panduan Bandung",
  description:
    "Daftar kuliner & roti populer Bandung (Roti Macan, Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Seroja Bake, Sapporo Soes, Makjay, In Parfume) serta panduan pengiriman Bawabawa.id.",
  alternates: { canonical: "/blog" },
};

type AdminPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  readTime: string | null;
  publishedAt: string | null;
};

async function fetchAdminPosts(): Promise<AdminPost[]> {
  const erp = await erpSafe<AdminPost[]>({
    path: "/blog-posts",
    timeoutMs: 4000,
    cache: "force-cache",
    next: { revalidate: 60, tags: ["blog"] },
  });
  return erp.ok && Array.isArray(erp.data) ? erp.data : [];
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function BlogPage() {
  const adminPosts = await fetchAdminPosts();
  const seenSlugs = new Set(adminPosts.map((p) => p.slug));

  const merged = [
    ...adminPosts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? "",
      category: p.category ?? "Artikel Bandung",
      readTime: p.readTime ?? "4 min",
      date: formatDate(p.publishedAt) || "Terbaru",
    })),
    ...VIRAL_BANDUNG_BLOGS.filter((b) => !seenSlugs.has(b.slug)).map((b) => ({
      slug: b.slug,
      title: b.title,
      excerpt: b.excerpt,
      category: b.category,
      readTime: `${b.readingMinutes} min`,
      date: formatDate(b.publishedAt),
    })),
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] font-semibold">
        Cerita &amp; Panduan
      </p>
      <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight">
        Rekomendasi Bandung &amp; tips titip barang.
      </h1>
      <p className="mt-3 max-w-2xl text-sm sm:text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
        Ditulis dari pengalaman tim belanja kami setiap minggu di Bandung — mulai dari jadwal war Roti Macan &amp; Bolu Pisang Tjilaki 9 hingga tips kirim makanan ke luar kota.
      </p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {merged.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 hover:border-[hsl(var(--sage-700))] hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="font-semibold text-[hsl(var(--sage-700))]">
                  {p.category}
                </span>
                <span>·</span>
                <Clock className="h-3 w-3" />
                {p.readTime}
                <span>·</span>
                {p.date}
              </div>
              <h2 className="mt-2 text-lg font-bold tracking-tight leading-snug group-hover:text-[hsl(var(--sage-700))] transition-colors">
                {p.title}
              </h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {p.excerpt}
              </p>
            </div>
            <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--sage-700))] group-hover:gap-2 transition-all">
              Baca selengkapnya
              <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
        ))}
      </div>
    </article>
  );
}
