import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { erpSafe } from "@/lib/erp-client";
import { VIRAL_BANDUNG_BLOGS } from "@/lib/viral-bandung-data";

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

export async function generateStaticParams(): Promise<Params[]> {
  return VIRAL_BANDUNG_BLOGS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const admin = await fetchAdminPost(slug);
  if (admin) {
    return {
      title: admin.title,
      description: admin.excerpt ?? admin.title,
      alternates: { canonical: `/blog/${slug}` },
    };
  }
  const post = VIRAL_BANDUNG_BLOGS.find((b) => b.slug === slug);
  if (!post) return { title: "Artikel Tidak Ditemukan" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const admin = await fetchAdminPost(slug);
  const fallback = VIRAL_BANDUNG_BLOGS.find((b) => b.slug === slug);
  const post = admin
    ? {
        title: admin.title,
        description: admin.excerpt ?? "",
        category: admin.category ?? "Artikel",
        readTime: admin.readTime ?? "5 min",
        date: formatDate(admin.publishedAt) || "baru",
        paragraphs: admin.contentMd
          .split(/\n{2,}/)
          .map((p) => p.replace(/^#+\s*/, "").trim())
          .filter(Boolean),
      }
    : fallback
    ? {
        title: fallback.title,
        description: fallback.excerpt,
        category: fallback.category,
        readTime: `${fallback.readingMinutes} min`,
        date: formatDate(fallback.publishedAt),
        paragraphs: fallback.bodyMd
          .split(/\n{2,}/)
          .map((p: string) => p.replace(/^#+\s*/, "").trim())
          .filter(Boolean),
      }
    : null;

  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke Blog
      </Link>

      <div className="mt-6 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        <span className="rounded-full bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-900))] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))] px-2.5 py-0.5 font-semibold">
          {post.category}
        </span>
        <span>·</span>
        <Clock className="h-3 w-3" />
        {post.readTime}
        <span>·</span>
        <Calendar className="h-3 w-3" />
        {post.date}
      </div>

      <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
        {post.title}
      </h1>

      <div className="mt-8 space-y-5 text-[hsl(var(--foreground)/0.9)] leading-relaxed">
        {post.paragraphs.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6">
        <p className="font-semibold">Mau titip barang dari artikel ini?</p>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Kirim nama barangnya lewat halaman request — tim kami cek stok &amp; harga dulu.
        </p>
        <Link
          href="/request"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] hover:underline"
        >
          Titip Sekarang →
        </Link>
      </div>
    </article>
  );
}
