import { useCallback, useRef, useState } from "react";
import { api } from "../../api/client";
import { Button } from "./Button";

export type UploadFolder = "media" | "blog" | "orders" | "products";

export interface UploadedFile {
  url: string;
  pathname: string;
  contentType: string;
  sizeBytes: number;
}

interface FileUploaderProps {
  /** Sub-folder under Vercel Blob to store the file in. */
  folder: UploadFolder;
  /** Optional preferred slug — sanitized server-side. */
  filename?: string;
  /** Called when an upload finishes successfully with the resulting public URL. */
  onUpload: (file: UploadedFile) => void;
  /**
   * Optional label for the trigger button. Defaults to "Pilih file" so the
   * uploader can be dropped into any admin form.
   */
  buttonLabel?: string;
  /** Optional helper hint shown under the trigger row. */
  hint?: string;
  /** Disable the input entirely while a parent form is submitting, etc. */
  disabled?: boolean;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";

/**
 * Drag-and-drop / click-to-choose image uploader for the admin ERP. Uploads
 * directly to `POST /api/v1/uploads`, which forwards the file to Vercel
 * Blob and returns the public URL. Designed as a building block for any
 * admin form that needs an `image_url` field (media library, blog hero,
 * product photo, manual order receipt screenshot).
 *
 * Surfaces friendly Indonesian error messages for the well-known failure
 * modes (BLOB_NOT_CONFIGURED, FILE_TOO_LARGE, INVALID_MIME) so admins
 * understand exactly what went wrong without inspecting the network tab.
 */
export function FileUploader(props: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setBusy(true);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("folder", props.folder);
        if (props.filename) form.append("filename", props.filename);

        const res = await api.post<{ success: boolean; data: UploadedFile; error?: { code: string; message: string } }>(
          "/uploads",
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (!res.data?.success) {
          throw new Error(res.data?.error?.message ?? "Upload gagal");
        }
        props.onUpload(res.data.data);
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [props]
  );

  const onPick = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) await upload(file);
    },
    [upload]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) await upload(file);
    },
    [upload]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!props.disabled && !busy) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      style={{
        border: `1px dashed ${dragOver ? "var(--color-accent, #047857)" : "var(--color-border, #d1d5db)"}`,
        borderRadius: 12,
        padding: 16,
        background: dragOver ? "rgba(4, 120, 87, 0.06)" : "transparent",
        transition: "background 120ms, border-color 120ms"
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onPick}
        disabled={busy || props.disabled}
        style={{ display: "none" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={busy}
          disabled={props.disabled}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Mengunggah…" : props.buttonLabel ?? "Pilih file"}
        </Button>
        <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
          atau drop image di sini · maks 5 MB · PNG/JPG/WEBP/GIF/AVIF
        </span>
      </div>
      {props.hint ? (
        <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 8 }}>{props.hint}</p>
      ) : null}
      {error ? (
        <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 8 }}>{error}</p>
      ) : null}
    </div>
  );
}

interface AxiosLikeError {
  response?: { data?: { error?: { code?: string; message?: string } } };
  message?: string;
}

function extractErrorMessage(err: unknown): string {
  const asAxios = err as AxiosLikeError;
  const code = asAxios?.response?.data?.error?.code;
  const serverMessage = asAxios?.response?.data?.error?.message;
  if (code === "BLOB_NOT_CONFIGURED") {
    return "Vercel Blob belum di-set di environment. Hubungi admin untuk konfigurasi BLOB_READ_WRITE_TOKEN.";
  }
  if (code === "FILE_TOO_LARGE") {
    return "Ukuran file melebihi 5 MB. Coba kompres dulu sebelum upload.";
  }
  if (code === "INVALID_MIME") {
    return "Format file tidak diizinkan. Pakai PNG, JPG, WEBP, GIF, atau AVIF.";
  }
  if (code === "FORBIDDEN") {
    return "Akun Anda tidak punya permission cms:manage untuk upload.";
  }
  return serverMessage ?? asAxios?.message ?? "Upload gagal";
}
