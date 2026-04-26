import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AdminLayout } from "./AdminLayout";
import { Button } from "../../shared/ui/primitives";
import { AlertDialog } from "../../shared/ui/primitives/Dialog";
import {
  createMedia,
  deleteMedia,
  fetchMedia,
  type MediaItem
} from "../../shared/api/cms";

interface MediaFormShape {
  filename: string;
  publicUrl: string;
  storagePath: string;
  altText: string;
  mimeType: string;
}

const EMPTY: MediaFormShape = {
  filename: "",
  publicUrl: "",
  storagePath: "",
  altText: "",
  mimeType: "image/png"
};

export function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<MediaFormShape>({
    defaultValues: EMPTY
  });

  async function refresh() {
    setLoading(true);
    try {
      const list = await fetchMedia();
      setItems(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat media";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onSubmit(values: MediaFormShape) {
    try {
      await createMedia({
        filename: values.filename,
        publicUrl: values.publicUrl,
        storagePath: values.storagePath || values.publicUrl,
        altText: values.altText || null,
        mimeType: values.mimeType || null,
        sizeBytes: 0
      });
      toast.success("Media ditambahkan");
      reset(EMPTY);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menambahkan media";
      toast.error(message);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMedia(pendingDelete.id);
      toast.success(`Media "${pendingDelete.filename}" dihapus`);
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus";
      toast.error(message);
    }
  }

  function copyUrl(url: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(url).then(() => toast.success("URL disalin"));
    }
  }

  return (
    <AdminLayout
      title="Media"
      subtitle="Daftar URL gambar siap pakai sebagai logo, og:image, atau ilustrasi sections. Backend storage disesuaikan kebutuhan deploy."
    >
      <h2 className="admin-section-title">Tambah media</h2>
      <p className="admin-section-subtitle">
        Tempel URL publik (CDN, S3, Supabase Storage, dsb). Backend hanya menyimpan referensi — upload binary
        akan ditangani oleh integrasi storage di deploy production.
      </p>
      <form className="admin-form" onSubmit={handleSubmit(onSubmit)} style={{ marginBottom: 28 }}>
        <div className="admin-row two-col">
          <div className="admin-field">
            <label htmlFor="m-filename">Filename</label>
            <input id="m-filename" {...register("filename", { required: true })} />
            {errors.filename ? <span className="admin-field-hint" style={{ color: "#b91c1c" }}>Filename wajib</span> : null}
          </div>
          <div className="admin-field">
            <label htmlFor="m-mime">MIME type</label>
            <input id="m-mime" {...register("mimeType")} placeholder="image/png" />
          </div>
        </div>
        <div className="admin-field">
          <label htmlFor="m-url">Public URL</label>
          <input id="m-url" type="url" placeholder="https://…" {...register("publicUrl", { required: true })} />
          {errors.publicUrl ? <span className="admin-field-hint" style={{ color: "#b91c1c" }}>URL wajib</span> : null}
        </div>
        <div className="admin-field">
          <label htmlFor="m-storage">Storage path (optional)</label>
          <input id="m-storage" {...register("storagePath")} />
        </div>
        <div className="admin-field">
          <label htmlFor="m-alt">Alt text</label>
          <input id="m-alt" {...register("altText")} />
        </div>
        <div className="admin-actions">
          <Button type="submit" loading={isSubmitting}>Tambah</Button>
        </div>
      </form>

      <h2 className="admin-section-title">Library</h2>
      {loading ? (
        <div className="admin-loading">Memuat media…</div>
      ) : items.length === 0 ? (
        <div className="admin-empty">
          <strong>Belum ada media</strong>
          Tambah URL pertama lewat form di atas.
        </div>
      ) : (
        <div className="admin-grid-thumb">
          {items.map((item) => (
            <div key={item.id} className="admin-thumb">
              {item.mimeType?.startsWith("image/") ? (
                <img src={item.publicUrl} alt={item.altText ?? item.filename} loading="lazy" />
              ) : (
                <div style={{ height: 120, display: "grid", placeItems: "center", color: "var(--color-muted)", fontSize: 12 }}>
                  {item.mimeType ?? "file"}
                </div>
              )}
              <strong style={{ fontSize: 13, color: "var(--color-text-strong)" }}>{item.filename}</strong>
              <div className="admin-thumb-meta">{item.publicUrl}</div>
              <div className="admin-list-actions" style={{ marginTop: 4 }}>
                <Button variant="outline" size="sm" onClick={() => copyUrl(item.publicUrl)}>Copy URL</Button>
                <Button variant="danger" size="sm" onClick={() => setPendingDelete(item)}>Hapus</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!pendingDelete}
        title={`Hapus "${pendingDelete?.filename ?? ""}"?`}
        description="Item akan dihapus dari library media."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
