import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { VIRAL_BANDUNG_BLOGS } from "@/lib/viral-bandung-data";
import { Button } from "@/components/ui/button";

type Params = { slug: string };

type AdminBlogPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  contentMd: string;
  category: string | null;
  readTime: string | null;
  publishedAt: string | null;
};

async function fetchAdminPost(slug: string): Promise<AdminBlogPost | null> {
  const erp = await erpSafe<AdminBlogPost | null>({
    path: `/blog-posts/${encodeURIComponent(slug)}`,
    timeoutMs: 4000,
    cache: "force-cache",
    next: { revalidate: 60, tags: ["blog"] },
  });
  return erp.ok && erp.data ? erp.data : null;
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

function renderMarkdown(md: string): Array<{ type: "h1" | "h2" | "h3" | "li" | "p"; text: string }> {
  const blocks: Array<{ type: "h1" | "h2" | "h3" | "li" | "p"; text: string }> = [];
  for (const raw of md.split(/\n{2,}/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("### ")) blocks.push({ type: "h3", text: line.slice(4) });
    else if (line.startsWith("## ")) blocks.push({ type: "h2", text: line.slice(3) });
    else if (line.startsWith("# ")) blocks.push({ type: "h1", text: line.slice(2) });
    else if (line.startsWith("* ") || line.startsWith("- ")) {
      for (const item of line.split("\n")) {
        blocks.push({ type: "li", text: item.replace(/^[*-]\s+/, "") });
      }
    } else blocks.push({ type: "p", text: line });
  }
  return blocks;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const admin = await fetchAdminPost(slug);
  if (admin) {
    return {
      title: admin.title,
      description: admin.excerpt ?? admin.title,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: { title: admin.title, description: admin.excerpt ?? admin.title, type: "article" },
    };
  }
  const seeded = VIRAL_BANDUNG_BLOGS.find((b) => b.slug === slug);
  if (seeded) {
    return {
      title: seeded.title,
      description: seeded.excerpt,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: { title: seeded.title, description: seeded.excerpt, type: "article" },
    };
  }
  return {};
}

export async function generateStaticParams() {
  return VIRAL_BANDUNG_BLOGS.map((b) => ({ slug: b.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const admin = await fetchAdminPost(slug);
  const seeded = VIRAL_BANDUNG_BLOGS.find((b) => b.slug === slug);

  if (!admin && !seeded) notFound();

  const title = admin?.title ?? seeded!.title;
  const category = admin?.category ?? seeded?.category ?? "Kuliner Viral Bandung";
  const date = formatDate(admin?.publishedAt ?? seeded?.publishedAt ?? null) || "Terbaru";
  const readTime = admin?.readTime ?? `${seeded?.readingMinutes ?? 4} min`;
  const md = admin?.contentMd ?? seeded!.bodyMd;
  const blocks = renderMarkdown(md);

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Semua Artikel &amp; Panduan
      </Link>

      <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold">
        <span className="rounded-full bg-[hsl(var(--sage-50))] border border-[hsl(var(--sage-200))] text-[hsl(var(--foreground))] px-2.5 py-0.5 font-bold">
          {category}
        </span>
        <span>·</span>
        <Calendar className="h-3 w-3" />
        {date}
        <span>·</span>
        <Clock className="h-3 w-3" />
        {readTime}
      </div>

      <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-[hsl(var(--foreground))]">
        {title}
      </h1>

      <div className="mt-8 space-y-5 text-[hsl(var(--foreground))] leading-relaxed">
        {blocks.map((b, i) => {
          switch (b.type) {
            case "h1":
            case "h2":
              return (
                <h2 key={i} className="font-display text-2xl font-bold tracking-tight mt-8 text-[hsl(var(--foreground))]">
                  {b.text}
                </h2>
              );
            case "h3":
              return (
                <h3 key={i} className="text-lg font-bold tracking-tight mt-6 text-[hsl(var(--sage-700))]">
                  {b.text}
                </h3>
              );
            case "li":
              return (
                <li key={i} className="ml-6 list-disc text-sm sm:text-base">
                  {b.text}
                </li>
              );
            default:
              return <p key={i} className="text-sm sm:text-base">{b.text}</p>;
          }
        })}
      </div>

      <div className="mt-12 rounded-3xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-[hsl(var(--foreground))]">
            Mau titip barang yang dibahas di artikel ini?
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
            Tersedia pengiriman Bandung Instant, Travel Jawa Barat/Jakarta, dan Kloter Hub Samarinda.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href="/request">
            Titip Sekarang <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
