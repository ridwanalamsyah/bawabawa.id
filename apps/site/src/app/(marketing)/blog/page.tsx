import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { VIRAL_BANDUNG_BLOGS } from "@/lib/viral-bandung-data";

export const metadata: Metadata = {
  title: "Blog & Tips Belanja",
  description:
    "Cerita customer, tips belanja dari Bandung, panduan jastip, dan rekomendasi kuliner Bandung.",
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
      category: p.category ?? "Artikel",
      readTime: p.readTime ?? "5 min",
      date: formatDate(p.publishedAt) || "baru",
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
    <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
        Blog
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
        Cerita, tips &amp; panduan belanja
      </h1>
      <p className="mt-4 max-w-2xl text-[hsl(var(--muted-foreground))] leading-relaxed">
        Dari rekomendasi kuliner &amp; barang Bandung, panduan jastip aman,
        sampai tips kirim ke luar kota.
      </p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
        {merged.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 hover:border-[hsl(var(--sage-400))] hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
              <span className="rounded-full bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-900))] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))] px-2 py-0.5">
                {p.category}
              </span>
              <span>·</span>
              <Clock className="h-3 w-3" />
              {p.readTime}
              <span>·</span>
              {p.date}
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight leading-snug group-hover:text-[hsl(var(--sage-700))] transition-colors">
              {p.title}
            </h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              {p.excerpt}
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] group-hover:gap-2.5 transition-all">
              Baca selengkapnya
              <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </Link>
        ))}
      </div>
    </article>
  );
}
