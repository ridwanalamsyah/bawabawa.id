import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";

export const metadata: Metadata = {
  title: "Blog & Tips Belanja",
  description:
    "Cerita customer, tips belanja online dari Bandung, panduan jastip, dan review produk legendaris Bandung.",
  alternates: { canonical: "/blog" },
};

// Posts curated and shipped with the site. These are the baseline
// catalog. Admin-published posts from the ERP are merged in on top of
// these at render time (see fetchAdminPosts below).
const POSTS = [
  {
    slug: "panduan-belanja-pasar-baru-bandung",
    title: "Panduan lengkap belanja di Pasar Baru Bandung untuk pemula",
    excerpt:
      "Pasar Baru = surga fashion harga distro. Tapi kalau pertama kali, gampang nyasar & ditipu harga turis. Tips dari shopper kami.",
    category: "Tips Belanja",
    readTime: "6 min",
    date: "12 Apr 2025",
  },
  {
    slug: "review-oleh-oleh-bandung-legendaris",
    title: "10 oleh-oleh Bandung legendaris yang wajib dicicipi",
    excerpt:
      "Kartika Sari pisang bollen, Amanda brownies kukus, bolu susu Lembang — kenapa orang Bandung sumpah cinta sama mereka.",
    category: "Kuliner",
    readTime: "8 min",
    date: "5 Apr 2025",
  },
  {
    slug: "tips-jastip-aman-anti-tipu",
    title: "5 tanda jasa titip aman vs penipu — cek dulu sebelum transfer",
    excerpt:
      "Setiap bulan ribuan orang ditipu jastip abal-abal di Instagram. Ini checklist sebelum kamu transfer ke jasa titip.",
    category: "Edukasi",
    readTime: "5 min",
    date: "28 Mar 2025",
  },
  {
    slug: "brand-distro-bandung-2025",
    title: "Brand distro Bandung paling hits 2025 — Erigo, Eiger, sampai pendatang baru",
    excerpt:
      "Selain Erigo & Eiger, ada banyak brand distro lokal Bandung yang lagi rising. Wajib masuk wishlist.",
    category: "Fashion",
    readTime: "7 min",
    date: "20 Mar 2025",
  },
];

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
  const merged = [
    ...adminPosts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? "",
      category: p.category ?? "Artikel",
      readTime: p.readTime ?? "5 min",
      date: formatDate(p.publishedAt) || "baru",
    })),
    ...POSTS,
  ];

  return (
    <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
        Blog
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
        Cerita, tips & panduan belanja
      </h1>
      <p className="mt-4 max-w-2xl text-[hsl(var(--muted-foreground))] leading-relaxed">
        Dari rekomendasi tempat belanja terbaik di Bandung, panduan jastip aman,
        sampai review produk yang lagi viral di Samarinda.
      </p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
        {merged.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.7)] backdrop-blur-sm p-6 hover:border-[hsl(var(--sage-400))] hover:-translate-y-0.5 transition-all"
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

      <div className="mt-12 rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)] p-8 text-center">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Lebih banyak artikel segera hadir. Subscribe untuk update via email.
        </p>
      </div>
    </article>
  );
}
