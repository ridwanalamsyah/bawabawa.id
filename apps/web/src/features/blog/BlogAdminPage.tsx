import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AppShell } from "../../shared/ui/shell/AppShell";
import { Button, Dialog, GlassCard } from "../../shared/ui/primitives";
import { api } from "../../shared/api/client";

/**
 * Admin page for managing blog posts that surface on the marketing
 * site at /blog. Posts here ADD to (don't replace) the hand-curated
 * posts already shipped with the site — both sets are merged at
 * render time. So admin can ship a new article without redeploying
 * the marketing site.
 */
type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  contentMd: string;
  category: string | null;
  readTime: string | null;
  heroImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PostForm = {
  slug: string;
  title: string;
  excerpt: string;
  contentMd: string;
  category: string;
  readTime: string;
  heroImageUrl: string;
  isPublished: boolean;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const reload = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; data: BlogPost[] }>(
        "/admin/blog-posts"
      );
      setPosts(Array.isArray(response.data?.data) ? response.data.data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat blog post");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const publishedCount = useMemo(
    () => posts.filter((p) => p.isPublished).length,
    [posts]
  );

  async function togglePublished(post: BlogPost) {
    try {
      await api.patch(`/admin/blog-posts/${post.slug}`, {
        isPublished: !post.isPublished
      });
      await reload();
      toast.success(post.isPublished ? "Post di-unpublish" : "Post di-publish");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    }
  }

  async function deletePost(post: BlogPost) {
    if (!confirm(`Hapus post "${post.title}"? Tidak bisa di-undo.`)) return;
    try {
      await api.delete(`/admin/blog-posts/${post.slug}`);
      await reload();
      toast.success("Post dihapus");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus");
    }
  }

  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
      >
        <GlassCard elevated>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 16
            }}
          >
            <div>
              <h1 style={{ margin: 0 }}>Blog Post</h1>
              <p style={{ marginTop: 8, color: "var(--color-muted)", fontSize: 14 }}>
                Tulis artikel baru atau update yang sudah ada. Post di-publish
                muncul di halaman /blog di marketing site, bergabung dengan post
                yang sudah ada bawaan situs.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>+ Tulis Post Baru</Button>
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 12,
              fontSize: 13,
              color: "var(--color-muted)"
            }}
          >
            <span>
              <strong style={{ color: "var(--color-text-strong)" }}>{posts.length}</strong>{" "}
              total
            </span>
            <span>·</span>
            <span>
              <strong style={{ color: "var(--color-text-strong)" }}>
                {publishedCount}
              </strong>{" "}
              dipublish
            </span>
          </div>

          <div style={{ marginTop: 24 }}>
            {loading ? (
              <p style={{ color: "var(--color-muted)" }}>Memuat post…</p>
            ) : error ? (
              <p style={{ color: "var(--color-danger, #b91c1c)" }}>{error}</p>
            ) : posts.length === 0 ? (
              <div
                style={{
                  border: "1px dashed var(--color-border, rgba(0,0,0,.16))",
                  borderRadius: 12,
                  padding: "32px 24px",
                  textAlign: "center"
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>Belum ada post</p>
                <p
                  style={{ margin: "8px 0 16px", color: "var(--color-muted)", fontSize: 14 }}
                >
                  Tulis post pertama — bisa tentang tips belanja, customer story,
                  atau panduan layanan.
                </p>
                <Button onClick={() => setCreateOpen(true)}>+ Tulis Post Baru</Button>
              </div>
            ) : (
              <PostsTable
                posts={posts}
                onEdit={(p) => setEditing(p)}
                onTogglePublish={togglePublished}
                onDelete={deletePost}
              />
            )}
          </div>
        </GlassCard>
      </motion.section>

      <PostFormDialog
        mode="create"
        post={null}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          void reload();
        }}
      />
      <PostFormDialog
        mode="edit"
        post={editing}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void reload();
        }}
      />
    </AppShell>
  );
}

function PostsTable({
  posts,
  onEdit,
  onTogglePublish,
  onDelete
}: {
  posts: BlogPost[];
  onEdit: (p: BlogPost) => void;
  onTogglePublish: (p: BlogPost) => void;
  onDelete: (p: BlogPost) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--color-muted)" }}>
            <Th>Judul</Th>
            <Th>Kategori</Th>
            <Th>Status</Th>
            <Th>Publish</Th>
            <Th>Aksi</Th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr
              key={p.id}
              style={{ borderTop: "1px solid var(--color-border, rgba(0,0,0,.08))" }}
            >
              <Td>
                <strong>{p.title}</strong>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                  /blog/{p.slug}
                </div>
              </Td>
              <Td>{p.category ?? "—"}</Td>
              <Td>
                {p.isPublished ? (
                  <span style={{ color: "#059669", fontWeight: 600 }}>
                    Live
                  </span>
                ) : (
                  <span style={{ color: "var(--color-muted)" }}>Draft</span>
                )}
              </Td>
              <Td>{formatDate(p.publishedAt)}</Td>
              <Td>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={p.isPublished ? "ghost" : "primary"}
                    onClick={() => onTogglePublish(p)}
                  >
                    {p.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(p)}>
                    Hapus
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "8px 12px",
        fontWeight: 600,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.4
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "12px", verticalAlign: "top" }}>{children}</td>;
}

function PostFormDialog({
  mode,
  post,
  open,
  onClose,
  onSaved
}: {
  mode: "create" | "edit";
  post: BlogPost | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<PostForm>();

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && post) {
      reset({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt ?? "",
        contentMd: post.contentMd,
        category: post.category ?? "",
        readTime: post.readTime ?? "",
        heroImageUrl: post.heroImageUrl ?? "",
        isPublished: post.isPublished
      });
    } else {
      reset({
        slug: "",
        title: "",
        excerpt: "",
        contentMd: "",
        category: "Tips Belanja",
        readTime: "5 min",
        heroImageUrl: "",
        isPublished: false
      });
    }
  }, [open, mode, post, reset]);

  const title = watch("title");
  const slug = watch("slug");
  useEffect(() => {
    if (mode === "create" && title && !slug) {
      setValue("slug", slugify(title));
    }
  }, [title, slug, mode, setValue]);

  async function onSubmit(values: PostForm) {
    try {
      const payload: Record<string, unknown> = {
        title: values.title.trim(),
        contentMd: values.contentMd,
        isPublished: !!values.isPublished
      };
      if (values.excerpt.trim()) payload.excerpt = values.excerpt.trim();
      if (values.category.trim()) payload.category = values.category.trim();
      if (values.readTime.trim()) payload.readTime = values.readTime.trim();
      if (values.heroImageUrl.trim()) payload.heroImageUrl = values.heroImageUrl.trim();
      if (mode === "create") payload.slug = values.slug.trim();

      if (mode === "create") {
        await api.post("/admin/blog-posts", payload);
        toast.success("Post dibuat");
      } else {
        await api.patch(`/admin/blog-posts/${post!.slug}`, payload);
        toast.success("Post diperbarui");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Tulis Post Baru" : `Edit — ${post?.title ?? ""}`}
      description="Konten ditulis dalam Markdown sederhana (heading dengan #, bold **text**, list dengan -)."
      maxWidth="720px"
      actions={
        <>
          <Button variant="ghost" onClick={onClose} type="button">
            Batal
          </Button>
          <Button
            type="submit"
            form="post-form"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Menyimpan…"
              : mode === "create"
                ? "Simpan post"
                : "Update post"}
          </Button>
        </>
      }
    >
      <form
        id="post-form"
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "grid", gap: 16 }}
      >
        <Field label="Judul" error={errors.title?.message}>
          <input
            {...register("title", { required: "Wajib diisi", maxLength: 240 })}
            placeholder="contoh: Panduan belanja oleh-oleh khas Bandung"
          />
        </Field>

        <Field
          label="Slug"
          error={errors.slug?.message}
          hint={mode === "edit" ? "Slug tidak diubah setelah post dibuat." : "Otomatis dari judul. Boleh diubah manual."}
        >
          <input
            {...register("slug", {
              required: "Wajib diisi",
              pattern: {
                value: /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
                message: "Hanya huruf kecil, angka, dan tanda hubung"
              }
            })}
            placeholder="contoh: panduan-belanja-oleh-oleh-bandung"
            disabled={mode === "edit"}
          />
        </Field>

        <Field label="Excerpt (ringkasan singkat)" error={errors.excerpt?.message}>
          <textarea
            rows={2}
            {...register("excerpt", { maxLength: 500 })}
            placeholder="Ringkasan 1-2 kalimat untuk thumbnail dan preview."
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Kategori">
            <input {...register("category")} placeholder="contoh: Tips Belanja" />
          </Field>
          <Field label="Estimasi baca">
            <input {...register("readTime")} placeholder="contoh: 5 min" />
          </Field>
        </div>

        <Field label="Hero image URL (opsional)">
          <input
            type="url"
            {...register("heroImageUrl")}
            placeholder="https://images.unsplash.com/..."
          />
        </Field>

        <Field
          label="Konten (Markdown)"
          hint="Heading: # Judul Besar / ## Sub-heading. Bold: **kata**. List: - item."
          error={errors.contentMd?.message}
        >
          <textarea
            rows={14}
            {...register("contentMd", {
              required: "Wajib diisi",
              minLength: { value: 20, message: "Minimum 20 karakter" }
            })}
            placeholder={"# Judul artikel\n\nParagraf pertama...\n\n## Sub-judul\n\nDetail..."}
            style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}
          />
        </Field>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" {...register("isPublished")} />
          <span>
            <strong>Publish sekarang</strong> — kalau di-uncheck, tersimpan sebagai draft.
          </span>
        </label>
      </form>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  error,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {children}
      {hint ? (
        <span style={{ color: "var(--color-muted)", fontSize: 12 }}>{hint}</span>
      ) : null}
      {error ? (
        <span style={{ color: "var(--color-danger, #b91c1c)", fontSize: 12 }}>{error}</span>
      ) : null}
    </label>
  );
}
