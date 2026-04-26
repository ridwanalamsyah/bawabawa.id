import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AdminLayout } from "./AdminLayout";
import { Button } from "../../shared/ui/primitives";
import { AlertDialog } from "../../shared/ui/primitives/Dialog";
import {
  createNavItem,
  deleteNavItem,
  fetchAllNavItems,
  reorderNavItems,
  updateNavItem,
  type NavItem
} from "../../shared/api/cms";
import { useCms } from "../cms/CmsContext";

interface NavFormShape {
  id?: string;
  label: string;
  href: string;
  requiredPermission: string | null;
  requiredRole: string | null;
  sortOrder: number;
  isExternal: boolean;
  isActive: boolean;
}

const EMPTY_NAV: NavFormShape = {
  label: "",
  href: "/",
  requiredPermission: null,
  requiredRole: null,
  sortOrder: 100,
  isExternal: false,
  isActive: true
};

export function NavigationPage() {
  const cms = useCms();
  const [items, setItems] = useState<NavItem[]>([]);
  const [editing, setEditing] = useState<NavFormShape | null>(null);
  const [pendingDelete, setPendingDelete] = useState<NavItem | null>(null);
  const [loading, setLoading] = useState(true);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
    [items]
  );

  async function refresh() {
    setLoading(true);
    try {
      const list = await fetchAllNavItems();
      setItems(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat navigation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function move(item: NavItem, direction: -1 | 1) {
    const idx = sorted.findIndex((i) => i.id === item.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    try {
      const next = await reorderNavItems([
        { id: item.id, sortOrder: swapWith.sortOrder },
        { id: swapWith.id, sortOrder: item.sortOrder }
      ]);
      setItems(next);
      void cms.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengatur urutan";
      toast.error(message);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteNavItem(pendingDelete.id);
      toast.success(`"${pendingDelete.label}" dihapus`);
      setPendingDelete(null);
      await refresh();
      void cms.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus";
      toast.error(message);
    }
  }

  return (
    <AdminLayout
      title="Navigation"
      subtitle="Edit menu utama: label, link, urutan, dan permission gate. Tersimpan di tabel cms_nav_items."
    >
      <div className="admin-actions" style={{ justifyContent: "flex-end" }}>
        <Button onClick={() => setEditing({ ...EMPTY_NAV, sortOrder: (sorted.at(-1)?.sortOrder ?? 0) + 10 })}>
          Tambah link
        </Button>
      </div>

      {loading ? (
        <div className="admin-loading">Memuat menu…</div>
      ) : sorted.length === 0 ? (
        <div className="admin-empty">
          <strong>Belum ada item navigasi</strong>
          Klik "Tambah link" untuk menyusun menu.
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Label</th>
                <th>Href</th>
                <th>Gate</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, index) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Naikkan ${item.label}`}
                        disabled={index === 0}
                        onClick={() => move(item, -1)}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Turunkan ${item.label}`}
                        disabled={index === sorted.length - 1}
                        onClick={() => move(item, 1)}
                      >
                        ↓
                      </Button>
                      <span style={{ minWidth: 32, color: "var(--color-muted)", fontSize: 12 }}>{item.sortOrder}</span>
                    </div>
                  </td>
                  <td><strong>{item.label}</strong></td>
                  <td><code style={{ fontSize: 12 }}>{item.href}</code></td>
                  <td style={{ fontSize: 12, color: "var(--color-muted)" }}>
                    {item.requiredPermission ?? item.requiredRole ?? "—"}
                  </td>
                  <td>
                    <span className={`admin-pill ${item.isActive ? "admin-pill-success" : "admin-pill-warn"}`}>
                      {item.isActive ? "active" : "hidden"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-list-actions">
                      <Button variant="outline" size="sm" onClick={() => setEditing({
                        id: item.id,
                        label: item.label,
                        href: item.href,
                        requiredPermission: item.requiredPermission,
                        requiredRole: item.requiredRole,
                        sortOrder: item.sortOrder,
                        isExternal: item.isExternal,
                        isActive: item.isActive
                      })}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => setPendingDelete(item)}>Hapus</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <NavEditDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
            void cms.refresh();
          }}
        />
      ) : null}

      <AlertDialog
        open={!!pendingDelete}
        title={`Hapus "${pendingDelete?.label ?? ""}"?`}
        description="Item akan dihapus permanen dari navigasi."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}

function NavEditDialog({
  initial,
  onClose,
  onSaved
}: {
  initial: NavFormShape;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<NavFormShape>({
    defaultValues: initial
  });

  async function onSubmit(values: NavFormShape) {
    try {
      const payload = {
        label: values.label,
        href: values.href,
        parentId: null,
        requiredPermission: values.requiredPermission || null,
        requiredRole: values.requiredRole || null,
        sortOrder: Number(values.sortOrder) || 0,
        isExternal: !!values.isExternal,
        isActive: !!values.isActive
      };
      if (initial.id) {
        await updateNavItem(initial.id, payload);
        toast.success("Navigation diperbarui");
      } else {
        await createNavItem(payload);
        toast.success("Navigation ditambahkan");
      }
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan";
      toast.error(message);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="admin-dialog-shroud" onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)", zIndex: 60, display: "grid", placeItems: "center", padding: 16, backdropFilter: "blur(6px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, width: "100%" }}>
        <form
          className="admin-form"
          onSubmit={handleSubmit(onSubmit)}
          style={{
            background: "var(--glass-bg-deep)",
            border: "1px solid var(--glass-border-strong)",
            borderRadius: 18,
            padding: 24,
            backdropFilter: "blur(24px)",
            boxShadow: "var(--glass-shadow-lg)"
          }}
        >
          <h2 className="admin-section-title" style={{ marginBottom: 4 }}>{initial.id ? "Edit" : "Tambah"} link</h2>
          <p className="admin-section-subtitle">Permission gate opsional dievaluasi via usePermission().</p>
          <div className="admin-row two-col">
            <div className="admin-field">
              <label htmlFor="nav-label">Label</label>
              <input id="nav-label" {...register("label", { required: "Label wajib" })} />
              {errors.label ? <span className="admin-field-hint" style={{ color: "#b91c1c" }}>{errors.label.message}</span> : null}
            </div>
            <div className="admin-field">
              <label htmlFor="nav-href">Href</label>
              <input id="nav-href" {...register("href", { required: "Href wajib" })} />
            </div>
          </div>
          <div className="admin-row two-col">
            <div className="admin-field">
              <label htmlFor="nav-perm">Required permission</label>
              <input id="nav-perm" placeholder="e.g. orders:read" {...register("requiredPermission")} />
            </div>
            <div className="admin-field">
              <label htmlFor="nav-role">Required role</label>
              <input id="nav-role" placeholder="e.g. admin" {...register("requiredRole")} />
            </div>
          </div>
          <div className="admin-row two-col">
            <div className="admin-field">
              <label htmlFor="nav-order">Sort order</label>
              <input id="nav-order" type="number" min={0} step={10} {...register("sortOrder", { valueAsNumber: true })} />
            </div>
            <div className="admin-field" style={{ justifyContent: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" {...register("isActive")} />
                Aktif
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" {...register("isExternal")} />
                External (target=_blank)
              </label>
            </div>
          </div>
          <div className="admin-actions" style={{ justifyContent: "flex-end" }}>
            <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
            <Button type="submit" loading={isSubmitting}>Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
