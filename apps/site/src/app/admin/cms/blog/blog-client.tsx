"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { errorMessage } from "@/lib/order-requests";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  contentMd: string;
  category: string | null;
  readTime: string | null;
  heroImageUrl: string | null;
  isPublished: boolean;
  updatedAt: string;
};

type Draft = {
  slug: string;
  title: string;
  excerpt: string;
  contentMd: string;
  category: string;
  heroImageUrl: string;
  isPublished: boolean;
};

const EMPTY: Draft = { slug: "", title: "", excerpt: "", contentMd: "", category: "", heroImageUrl: "", isPublished: false };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Rough reading time for Indonesian prose (~200 words/min). */
const readTime = (md: string) => `${Math.max(1, Math.round(md.split(/\s+/).filter(Boolean).length / 200))} menit`;

export function BlogClient() {
  const [posts, setPosts] = React.useState<Post[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<{ original: string | null; draft: Draft } | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/blog-posts", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(data)) return setError(errorMessage(data, `Gagal memuat (${res.status})`));
    setError(null);
    setPosts(data as Post[]);
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (editing) {
    return (
      <Editor
        original={editing.original}
        initial={editing.draft}
        onDone={async () => {
          setEditing(null);
          await load();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({ original: null, draft: EMPTY })}>
        <Plus className="h-4 w-4" /> Artikel baru
      </Button>
      {error && <GlassCard className="p-4 text-sm text-[hsl(var(--rose-700))]">{error}</GlassCard>}
      {!posts && !error && <GlassCard className="p-6 text-sm text-[hsl(var(--muted-foreground))]">Memuat…</GlassCard>}
      {posts?.length === 0 && (
        <GlassCard className="p-6 text-sm text-[hsl(var(--muted-foreground))]">
          Belum ada artikel. Ide awal: &ldquo;Cara titip barang dari Bandung ke Samarinda&rdquo;, &ldquo;10 oleh-oleh Bandung yang tahan perjalanan&rdquo;.
        </GlassCard>
      )}
      <ul className="space-y-3">
        {posts?.map((p) => (
          <li key={p.id}>
            <GlassCard className="p-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{p.title}</span>
                  <Badge variant={p.isPublished ? "success" : "neutral"}>{p.isPublished ? "Terbit" : "Draf"}</Badge>
                  {p.category && <Badge variant="info">{p.category}</Badge>}
                </div>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  /blog/{p.slug} · diubah {formatDate(p.updatedAt, { day: "numeric", month: "short" })}
                </p>
              </div>
              <div className="flex gap-2">
                {p.isPublished && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/blog/${p.slug}`} target="_blank">Lihat</Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditing({
                      original: p.slug,
                      draft: {
                        slug: p.slug,
                        title: p.title,
                        excerpt: p.excerpt ?? "",
                        contentMd: p.contentMd,
                        category: p.category ?? "",
                        heroImageUrl: p.heroImageUrl ?? "",
                        isPublished: p.isPublished,
                      },
                    })
                  }
                >
                  Edit
                </Button>
              </div>
            </GlassCard>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Editor({ original, initial, onDone }: { original: string | null; initial: Draft; onDone: () => Promise<void> }) {
  const [d, setD] = React.useState<Draft>(initial);
  const [slugTouched, setSlugTouched] = React.useState(!!original);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setD((prev) => ({
      ...prev,
      [k]: value,
      ...(k === "title" && !slugTouched ? { slug: slugify(value) } : {}),
    }));
  };

  async function save(publish: boolean) {
    setErr(null);
    if (d.title.trim().length < 3) return setErr("Judul minimal 3 karakter.");
    if (!d.slug) return setErr("Slug wajib diisi.");
    if (d.contentMd.trim().length < 20) return setErr("Isi artikel minimal 20 karakter.");
    setBusy(true);
    const body = {
      slug: d.slug,
      title: d.title.trim(),
      excerpt: d.excerpt.trim() || null,
      contentMd: d.contentMd,
      category: d.category.trim() || null,
      readTime: readTime(d.contentMd),
      heroImageUrl: d.heroImageUrl.trim() || null,
      isPublished: publish,
    };
    const res = await fetch(original ? `/api/admin/blog-posts/${encodeURIComponent(original)}` : "/api/admin/blog-posts", {
      method: original ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) return setErr(errorMessage(await res.json().catch(() => null), "Gagal menyimpan"));
    await onDone();
  }

  return (
    <GlassCard className="p-5 sm:p-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="b-title">Judul</Label>
          <Input id="b-title" value={d.title} onChange={set("title")} placeholder="Cara titip barang dari Bandung ke Samarinda" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="b-slug">Alamat (slug)</Label>
          <Input
            id="b-slug"
            value={d.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setD({ ...d, slug: slugify(e.target.value) });
            }}
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">bawabawa.id/blog/{d.slug || "…"}</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="b-cat">Kategori</Label>
          <Input id="b-cat" value={d.category} onChange={set("category")} placeholder="Panduan, Oleh-oleh, Promo" />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="b-excerpt">Ringkasan (tampil di daftar & Google)</Label>
          <Input id="b-excerpt" value={d.excerpt} onChange={set("excerpt")} maxLength={500} />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="b-hero">URL gambar sampul (opsional)</Label>
          <Input id="b-hero" value={d.heroImageUrl} onChange={set("heroImageUrl")} placeholder="https://…" />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="b-body">Isi artikel (Markdown: ## Subjudul, **tebal**, - daftar)</Label>
          <Textarea id="b-body" value={d.contentMd} onChange={set("contentMd")} rows={16} className="font-mono text-sm" />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">± {readTime(d.contentMd)} baca</p>
        </div>
      </div>
      {err && <p className="text-sm text-[hsl(var(--rose-700))]">{err}</p>}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void save(true)}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {initial.isPublished ? "Simpan" : "Terbitkan"}
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => void save(false)}>
          {initial.isPublished ? "Jadikan draf" : "Simpan draf"}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => void onDone()}>
          Batal
        </Button>
      </div>
    </GlassCard>
  );
}
