import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AdminLayout } from "./AdminLayout";
import { Button } from "../../shared/ui/primitives";
import { AlertDialog } from "../../shared/ui/primitives/Dialog";
import {
  deleteSection,
  fetchSections,
  upsertSection,
  type CmsSection
} from "../../shared/api/cms";

interface SectionFormShape {
  key: string;
  title: string;
  subtitle: string;
  body: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY: SectionFormShape = {
  key: "",
  title: "",
  subtitle: "",
  body: "",
  ctaText: "",
  ctaLink: "",
  imageUrl: "",
  isActive: true
};

export function SectionsPage() {
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [editing, setEditing] = useState<SectionFormShape | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CmsSection | null>(null);
  const [loading, setLoading] = useState(true);
  const isNew = editing && !sections.find((s) => s.key === editing.key);

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<SectionFormShape>({
    defaultValues: EMPTY
  });

  async function refresh() {
    setLoading(true);
    try {
      const list = await fetchSections();
      setSections(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat sections";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function startNew() {
    setEditing(EMPTY);
    reset(EMPTY);
  }

  function startEdit(section: CmsSection) {
    const shape: SectionFormShape = {
      key: section.key,
      title: section.title ?? "",
      subtitle: section.subtitle ?? "",
      body: section.body ?? "",
      ctaText: section.ctaText ?? "",
      ctaLink: section.ctaLink ?? "",
      imageUrl: section.imageUrl ?? "",
      isActive: section.isActive
    };
    setEditing(shape);
    reset(shape);
  }

  async function onSubmit(values: SectionFormShape) {
    try {
      await upsertSection(values.key, {
        title: values.title || null,
        subtitle: values.subtitle || null,
        body: values.body || null,
        ctaText: values.ctaText || null,
        ctaLink: values.ctaLink || null,
        imageUrl: values.imageUrl || null,
        metadata: {},
        isActive: !!values.isActive
      });
      toast.success("Section tersimpan");
      setEditing(null);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan section";
      toast.error(message);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteSection(pendingDelete.key);
      toast.success(`Section "${pendingDelete.key}" dihapus`);
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus";
      toast.error(message);
    }
  }

  if (editing) {
    return (
      <AdminLayout title={isNew ? "Buat section" : `Edit: ${editing.key}`} subtitle="Section bisa dipanggil di frontend lewat key.">
        <form className="admin-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="admin-row two-col">
            <div className="admin-field">
              <label htmlFor="sec-key">Section key</label>
              <input id="sec-key" disabled={!isNew} {...register("key", { required: true, pattern: /^[a-z0-9_-]+$/i })} />
              {errors.key ? <span className="admin-field-hint" style={{ color: "#b91c1c" }}>Key hanya boleh huruf/angka/-/_</span> : null}
            </div>
            <div className="admin-field" style={{ justifyContent: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" {...register("isActive")} />
                Aktif (tampil di publik)
              </label>
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="sec-title">Title</label>
            <input id="sec-title" {...register("title")} />
          </div>
          <div className="admin-field">
            <label htmlFor="sec-sub">Subtitle</label>
            <input id="sec-sub" {...register("subtitle")} />
          </div>
          <div className="admin-field">
            <label htmlFor="sec-body">Body</label>
            <textarea id="sec-body" rows={4} {...register("body")} />
          </div>
          <div className="admin-row two-col">
            <div className="admin-field">
              <label htmlFor="sec-cta-text">CTA text</label>
              <input id="sec-cta-text" {...register("ctaText")} />
            </div>
            <div className="admin-field">
              <label htmlFor="sec-cta-link">CTA link</label>
              <input id="sec-cta-link" {...register("ctaLink")} />
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="sec-image">Image URL</label>
            <input id="sec-image" type="url" placeholder="https://…" {...register("imageUrl")} />
          </div>
          <div className="admin-actions">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Batal</Button>
            <Button type="submit" loading={isSubmitting}>Simpan</Button>
          </div>
        </form>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Sections" subtitle="Hero / CTA / banner berkunci stable section_key — dipanggil dari frontend.">
      <div className="admin-actions" style={{ justifyContent: "flex-end" }}>
        <Button onClick={startNew}>Buat section</Button>
      </div>

      {loading ? (
        <div className="admin-loading">Memuat sections…</div>
      ) : sections.length === 0 ? (
        <div className="admin-empty">
          <strong>Belum ada section</strong>
          Buat section pertama (mis. <code>home_hero</code>).
        </div>
      ) : (
        <ul className="admin-list">
          {sections.map((s) => (
            <li key={s.id} className="admin-list-item">
              <div className="admin-list-item-grow">
                <strong>{s.key}</strong>
                <span>{s.title || s.subtitle || s.body || "(tanpa konten)"}</span>
              </div>
              <span className={`admin-pill ${s.isActive ? "admin-pill-success" : "admin-pill-warn"}`}>
                {s.isActive ? "active" : "hidden"}
              </span>
              <div className="admin-list-actions">
                <Button variant="outline" size="sm" onClick={() => startEdit(s)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => setPendingDelete(s)}>Hapus</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        open={!!pendingDelete}
        title={`Hapus section "${pendingDelete?.key ?? ""}"?`}
        description="Section akan dihapus permanen."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
