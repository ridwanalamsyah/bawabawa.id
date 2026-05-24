import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AdminLayout } from "./AdminLayout";
import { Button } from "../../shared/ui/primitives";
import { AlertDialog } from "../../shared/ui/primitives/Dialog";
import { FileUploader, type UploadedFile } from "../../shared/ui/primitives/FileUploader";
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

function deriveFilenameFromPath(pathname: string): string {
  const last = pathname.split("/").pop() ?? "";
  return last || pathname;
}

export function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting, errors } } = useForm<MediaFormShape>({
    defaultValues: EMPTY
  });
  const publicUrl = watch("publicUrl");

  function handleUploaded(file: UploadedFile) {
    setValue("publicUrl", file.url, { shouldDirty: true });
    setValue("storagePath", file.pathname, { shouldDirty: true });
    setValue("mimeType", file.contentType, { shouldDirty: true });
    setValue("filename", deriveFilenameFromPath(file.pathname), { shouldDirty: true });
    toast.success("Gambar terunggah, tinggal isi alt text & simpan");
  }

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
        Upload langsung ke Vercel Blob (admin only, dengan permission cms:manage). Field URL & storage path
        otomatis terisi setelah upload selesai — Anda tinggal isi alt text dan simpan. URL eksternal masih
        bisa ditempel manual kalau gambar sudah hosted di tempat lain.
      </p>
      <div className="admin-field" style={{ marginBottom: 16 }}>
        <FileUploader
          folder="media"
          onUpload={handleUploaded}
          buttonLabel="Upload gambar"
          hint="Sukses upload akan otomatis isi Public URL, Storage path, MIME type & Filename di form di bawah."
        />
      </div>
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
          {publicUrl ? (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={publicUrl}
                alt="Preview upload"
                style={{ height: 56, width: "auto", borderRadius: 6, border: "1px solid var(--color-border, #d1d5db)" }}
              />
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>Preview</span>
            </div>
          ) : null}
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
