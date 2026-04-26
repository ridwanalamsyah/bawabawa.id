import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AdminLayout } from "./AdminLayout";
import { Button } from "../../shared/ui/primitives";
import { AlertDialog } from "../../shared/ui/primitives/Dialog";
import { RichTextEditor } from "./RichTextEditor";
import {
  createPage,
  deletePage,
  fetchPages,
  updatePage,
  type CmsPage
} from "../../shared/api/cms";

interface PageFormShape {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  isPublished: boolean;
}

export function PagesPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [pendingDelete, setPendingDelete] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const isNew = !editing?.id;

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<PageFormShape>({
    defaultValues: { slug: "", title: "", metaTitle: "", metaDescription: "", ogImage: "", isPublished: false }
  });

  async function refresh() {
    setLoading(true);
    try {
      const list = await fetchPages();
      setPages(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat pages";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function startNew() {
    setEditing({
      id: "",
      slug: "",
      title: "",
      content: {},
      metaTitle: null,
      metaDescription: null,
      ogImage: null,
      isPublished: false,
      publishedAt: null,
      createdAt: "",
      updatedAt: ""
    });
    setContent({});
    reset({ slug: "", title: "", metaTitle: "", metaDescription: "", ogImage: "", isPublished: false });
  }

  function startEdit(page: CmsPage) {
    setEditing(page);
    setContent(page.content ?? {});
    reset({
      slug: page.slug,
      title: page.title,
      metaTitle: page.metaTitle ?? "",
      metaDescription: page.metaDescription ?? "",
      ogImage: page.ogImage ?? "",
      isPublished: page.isPublished
    });
  }

  async function onSubmit(values: PageFormShape) {
    const payload = {
      slug: values.slug,
      title: values.title,
      content,
      metaTitle: values.metaTitle || null,
      metaDescription: values.metaDescription || null,
      ogImage: values.ogImage || null,
      isPublished: !!values.isPublished
    };
    try {
      if (editing && editing.id) {
        await updatePage(editing.id, payload);
        toast.success("Page tersimpan");
      } else {
        await createPage(payload);
        toast.success("Page dibuat");
      }
      setEditing(null);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan page";
      toast.error(message);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deletePage(pendingDelete.id);
      toast.success(`"${pendingDelete.title}" dihapus`);
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus";
      toast.error(message);
    }
  }

  if (editing) {
    return (
      <AdminLayout title={isNew ? "Buat Page" : `Edit: ${editing.title}`} subtitle="Konten Tiptap rich text disimpan sebagai JSON document.">
        <form className="admin-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="admin-row two-col">
            <div className="admin-field">
              <label htmlFor="page-title">Title</label>
              <input id="page-title" {...register("title", { required: "Title wajib" })} />
              {errors.title ? <span className="admin-field-hint" style={{ color: "#b91c1c" }}>{errors.title.message}</span> : null}
            </div>
            <div className="admin-field">
              <label htmlFor="page-slug">Slug</label>
              <input id="page-slug" {...register("slug", { required: "Slug wajib", pattern: { value: /^[a-z0-9-/_]+$/i, message: "Hanya huruf/angka/-/_/" } })} />
              {errors.slug ? <span className="admin-field-hint" style={{ color: "#b91c1c" }}>{errors.slug.message}</span> : null}
            </div>
          </div>

          <div className="admin-field">
            <label>Konten</label>
            <RichTextEditor value={content} onChange={setContent} ariaLabel="Konten halaman" />
          </div>

          <h2 className="admin-section-title" style={{ marginTop: 8 }}>SEO</h2>
          <div className="admin-row two-col">
            <div className="admin-field">
              <label htmlFor="page-meta-title">Meta title</label>
              <input id="page-meta-title" {...register("metaTitle")} />
            </div>
            <div className="admin-field">
              <label htmlFor="page-og">OG image URL</label>
              <input id="page-og" type="url" placeholder="https://…" {...register("ogImage")} />
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="page-meta-desc">Meta description</label>
            <textarea id="page-meta-desc" rows={3} {...register("metaDescription")} />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text)" }}>
            <input type="checkbox" {...register("isPublished")} />
            Publish
          </label>

          <div className="admin-actions">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Batal</Button>
            <Button type="submit" loading={isSubmitting}>Simpan</Button>
          </div>
        </form>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pages" subtitle="Halaman statis (about / kontak / terms) dengan rich text Tiptap dan publish flow.">
      <div className="admin-actions" style={{ justifyContent: "flex-end" }}>
        <Button onClick={startNew}>Buat page</Button>
      </div>

      {loading ? (
        <div className="admin-loading">Memuat pages…</div>
      ) : pages.length === 0 ? (
        <div className="admin-empty">
          <strong>Belum ada page</strong>
          Mulai dengan klik "Buat page".
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Diperbarui</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td><strong>{page.title}</strong></td>
                  <td><code style={{ fontSize: 12 }}>/{page.slug}</code></td>
                  <td>
                    <span className={`admin-pill ${page.isPublished ? "admin-pill-success" : "admin-pill-warn"}`}>
                      {page.isPublished ? "published" : "draft"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--color-muted)" }}>{new Date(page.updatedAt).toLocaleString("id-ID")}</td>
                  <td>
                    <div className="admin-list-actions">
                      <Button variant="outline" size="sm" onClick={() => startEdit(page)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => setPendingDelete(page)}>Hapus</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog
        open={!!pendingDelete}
        title={`Hapus "${pendingDelete?.title ?? ""}"?`}
        description="Page akan dihapus permanen."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
