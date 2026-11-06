import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { VIRAL_BANDUNG_BLOGS } from "@/lib/viral-bandung-data";

export const metadata: Metadata = {
  title: "Artikel, Panduan Jastip & Rekomendasi Kuliner Viral Bandung",
  description:
    "Daftar kuliner & roti viral Bandung 2026 (Roti Macan, Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Seroja Bake, Sapporo Soes, Makjay, In Parfume) serta panduan 3 jalur pengiriman Bawabawa.id.",
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5DFAD] px-3 py-1 text-xs font-bold text-[#24201A]">
        <Sparkles className="h-3.5 w-3.5 text-[#C8524B]" /> Jurnal &amp; Panduan Kuliner Bandung
      </span>
      <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#24201A]">
        Rekomendasi Kuliner Viral Bandung &amp; Panduan Jastip
      </h1>
      <p className="mt-3 max-w-2xl text-sm sm:text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
        Kurasi langsung oleh tim shopper Bandung &amp; Partner Hub Samarinda kami — mulai dari jadwal war antrean Roti Macan &amp; Bolu Pisang Tjilaki 9 hingga tips kirim makanan ke luar kota. Semua artikel dapat dikelola langsung dari menu <strong>Admin → Blog &amp; Artikel</strong>.
      </p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {merged.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 hover:border-[hsl(var(--sage-700))] hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold">
                <span className="rounded-full bg-[#F5DFAD] text-[#24201A] px-2.5 py-0.5 font-bold">
                  {p.category}
                </span>
                <span>·</span>
                <Clock className="h-3 w-3" />
                {p.readTime}
                <span>·</span>
                {p.date}
              </div>
              <h2 className="mt-3 font-display text-xl font-bold tracking-tight leading-snug text-[#24201A] group-hover:text-[hsl(var(--sage-700))] transition-colors">
                {p.title}
              </h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {p.excerpt}
              </p>
            </div>
            <p className="mt-4 pt-3 border-t border-[hsl(var(--border)/0.6)] inline-flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--sage-700))] group-hover:gap-2.5 transition-all">
              Baca Artikel Lengkap
              <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
        ))}
      </div>
    </article>
  );
}
