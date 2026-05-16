import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AppShell } from "../../shared/ui/shell/AppShell";
import { Button, Dialog, GlassCard } from "../../shared/ui/primitives";
import { api } from "../../shared/api/client";

type Voucher = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  max_discount: string | null;
  min_order_amount: string;
  max_uses: number | null;
  per_user_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  is_public: boolean;
  banner_label: string | null;
  banner_priority: number;
  used_count: number;
  created_at: string;
};

type CreateVoucherForm = {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  perUserLimit?: number;
  startsAt?: string;
  endsAt?: string;
};

function formatIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDiscount(v: Voucher) {
  const value = Number(v.discount_value);
  if (v.discount_type === "percentage") {
    const cap = v.max_discount ? ` (maks ${formatIDR(Number(v.max_discount))})` : "";
    return `${value}%${cap}`;
  }
  return formatIDR(value);
}

export function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; data: Voucher[] }>("/vouchers");
      setVouchers(Array.isArray(response.data?.data) ? response.data.data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat voucher");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const patch = useCallback(
    async (
      id: string,
      payload: {
        isActive?: boolean;
        isPublic?: boolean;
        bannerLabel?: string | null;
        bannerPriority?: number;
      }
    ) => {
      setSavingId(id);
      try {
        await api.patch(`/vouchers/${id}`, payload);
        await reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
      } finally {
        setSavingId(null);
      }
    },
    [reload]
  );

  const publicCount = useMemo(
    () => vouchers.filter((v) => v.is_public && v.is_active).length,
    [vouchers]
  );

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
              <h1 style={{ margin: 0 }}>Voucher & Promosi</h1>
              <p style={{ marginTop: 8, color: "var(--color-muted)", fontSize: 14 }}>
                Buat voucher diskon, atur aktif/non-aktif, dan pilih voucher mana
                yang ditampilkan sebagai banner di landing page publik. Voucher
                non-publik tetap bisa direedem oleh customer yang tahu kodenya
                (misal: dibagikan via DM/WA).
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>+ Buat Voucher</Button>
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
              <strong style={{ color: "var(--color-text-strong)" }}>{vouchers.length}</strong>{" "}
              voucher total
            </span>
            <span>·</span>
            <span>
              <strong style={{ color: "var(--color-text-strong)" }}>{publicCount}</strong>{" "}
              ditampilkan di banner publik
            </span>
          </div>

          <div style={{ marginTop: 24 }}>
            {loading ? (
              <p style={{ color: "var(--color-muted)" }}>Memuat voucher…</p>
            ) : error ? (
              <p style={{ color: "var(--color-danger, #b91c1c)" }}>{error}</p>
            ) : vouchers.length === 0 ? (
              <div
                style={{
                  border: "1px dashed var(--color-border, rgba(0,0,0,.16))",
                  borderRadius: 12,
                  padding: "32px 24px",
                  textAlign: "center"
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>Belum ada voucher</p>
                <p style={{ margin: "8px 0 16px", color: "var(--color-muted)", fontSize: 14 }}>
                  Buat voucher pertama — bisa untuk promo publik atau hanya
                  dibagikan privat ke customer tertentu.
                </p>
                <Button onClick={() => setCreateOpen(true)}>+ Buat Voucher</Button>
              </div>
            ) : (
              <VouchersTable
                vouchers={vouchers}
                onToggleActive={(v) => patch(v.id, { isActive: !v.is_active })}
                onTogglePublic={(v) => patch(v.id, { isPublic: !v.is_public })}
                onEditBanner={(v) => setEditing(v)}
                savingId={savingId}
              />
            )}
          </div>
        </GlassCard>
      </motion.section>

      <CreateVoucherDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          void reload();
        }}
      />
      <BannerEditDialog
        voucher={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void reload();
        }}
      />
    </AppShell>
  );
}

function VouchersTable({
  vouchers,
  onToggleActive,
  onTogglePublic,
  onEditBanner,
  savingId
}: {
  vouchers: Voucher[];
  onToggleActive: (v: Voucher) => void;
  onTogglePublic: (v: Voucher) => void;
  onEditBanner: (v: Voucher) => void;
  savingId: string | null;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--color-muted)" }}>
            <Th>Kode</Th>
            <Th>Diskon</Th>
            <Th>Min order</Th>
            <Th>Terpakai</Th>
            <Th>Aktif</Th>
            <Th>Publik</Th>
            <Th>Banner</Th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map((v) => (
            <tr
              key={v.id}
              style={{ borderTop: "1px solid var(--color-border, rgba(0,0,0,.08))" }}
            >
              <Td>
                <strong>{v.code}</strong>
                {v.description ? (
                  <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                    {v.description}
                  </div>
                ) : null}
              </Td>
              <Td>{formatDiscount(v)}</Td>
              <Td>{formatIDR(Number(v.min_order_amount))}</Td>
              <Td>
                {v.used_count}
                {v.max_uses ? ` / ${v.max_uses}` : ""}
              </Td>
              <Td>
                <Toggle
                  on={v.is_active}
                  disabled={savingId === v.id}
                  onChange={() => onToggleActive(v)}
                />
              </Td>
              <Td>
                <Toggle
                  on={v.is_public}
                  disabled={savingId === v.id || !v.is_active}
                  onChange={() => onTogglePublic(v)}
                  hint={
                    !v.is_active
                      ? "Voucher harus aktif dulu sebelum ditampilkan publik"
                      : v.is_public
                        ? "Saat ini tampil di banner landing page"
                        : "Hanya bisa diredem dengan kode (private)"
                  }
                />
              </Td>
              <Td>
                {v.is_public ? (
                  <button
                    type="button"
                    onClick={() => onEditBanner(v)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-link, #0369a1)",
                      fontSize: 13,
                      padding: 0,
                      textAlign: "left"
                    }}
                  >
                    {v.banner_label ?? "(set label)"}
                  </button>
                ) : (
                  <span style={{ color: "var(--color-muted)", fontSize: 12 }}>—</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Toggle({
  on,
  onChange,
  disabled,
  hint
}: {
  on: boolean;
  onChange: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      title={hint}
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        background: on ? "#10b981" : "rgba(0,0,0,.18)",
        border: "none",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.16s ease"
      }}
      aria-pressed={on}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.16s ease"
        }}
      />
    </button>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      style={{
        padding: "8px 12px",
        fontWeight: 600,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        textAlign: align ?? "left"
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <td
      style={{
        padding: "12px",
        verticalAlign: "top",
        textAlign: align ?? "left"
      }}
    >
      {children}
    </td>
  );
}

function CreateVoucherDialog({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateVoucherForm>({
    defaultValues: {
      code: "",
      description: "",
      discountType: "fixed",
      discountValue: 0
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        code: "",
        description: "",
        discountType: "fixed",
        discountValue: 0
      });
    }
  }, [open, reset]);

  const discountType = watch("discountType");

  async function onSubmit(values: CreateVoucherForm) {
    try {
      const payload: Record<string, unknown> = {
        code: values.code.trim().toUpperCase(),
        discountType: values.discountType,
        discountValue: Number(values.discountValue)
      };
      if (values.description?.trim()) payload.description = values.description.trim();
      if (values.maxDiscount) payload.maxDiscount = Number(values.maxDiscount);
      if (values.minOrderAmount) payload.minOrderAmount = Number(values.minOrderAmount);
      if (values.maxUses) payload.maxUses = Number(values.maxUses);
      if (values.perUserLimit) payload.perUserLimit = Number(values.perUserLimit);
      if (values.startsAt) payload.startsAt = new Date(values.startsAt).toISOString();
      if (values.endsAt) payload.endsAt = new Date(values.endsAt).toISOString();

      await api.post("/vouchers", payload, {
        headers: { "x-idempotency-key": `voucher-${crypto.randomUUID()}` }
      });
      toast.success(`Voucher ${payload.code} dibuat`);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat voucher");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Buat Voucher"
      description="Voucher baru tidak otomatis tampil di banner publik — toggle 'Publik' setelah dibuat."
      maxWidth="560px"
      actions={
        <>
          <Button variant="ghost" onClick={onClose} type="button">
            Batal
          </Button>
          <Button
            type="submit"
            form="voucher-create-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Buat voucher"}
          </Button>
        </>
      }
    >
      <form
        id="voucher-create-form"
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "grid", gap: 16 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Kode" error={errors.code?.message}>
            <input
              {...register("code", {
                required: "Wajib diisi",
                pattern: { value: /^[A-Z0-9_-]+$/i, message: "Hanya huruf/angka/-/_" }
              })}
              placeholder="BAWA50"
              style={{ textTransform: "uppercase" }}
            />
          </Field>
          <Field label="Tipe diskon">
            <select {...register("discountType", { required: true })}>
              <option value="fixed">Fixed (Rp)</option>
              <option value="percentage">Persen (%)</option>
            </select>
          </Field>
        </div>

        <Field label="Deskripsi (internal)">
          <input {...register("description")} placeholder="contoh: Promo soft launch" />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field
            label={discountType === "percentage" ? "Persen diskon" : "Nominal diskon (Rp)"}
            error={errors.discountValue?.message}
          >
            <input
              type="number"
              min={1}
              step={discountType === "percentage" ? 1 : 1000}
              {...register("discountValue", {
                required: "Wajib diisi",
                valueAsNumber: true,
                min: { value: 1, message: "Harus > 0" },
                max:
                  discountType === "percentage"
                    ? { value: 100, message: "Maksimum 100" }
                    : undefined
              })}
              placeholder={discountType === "percentage" ? "10" : "50000"}
            />
          </Field>
          {discountType === "percentage" ? (
            <Field label="Maks diskon (Rp)">
              <input
                type="number"
                min={0}
                step={1000}
                {...register("maxDiscount", { valueAsNumber: true })}
                placeholder="100000"
              />
            </Field>
          ) : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Min order (Rp, opsional)">
            <input
              type="number"
              min={0}
              step={1000}
              {...register("minOrderAmount", { valueAsNumber: true })}
              placeholder="0"
            />
          </Field>
          <Field label="Maks penggunaan total (opsional)">
            <input
              type="number"
              min={1}
              step={1}
              {...register("maxUses", { valueAsNumber: true })}
              placeholder="100"
            />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Berlaku mulai (opsional)">
            <input type="datetime-local" {...register("startsAt")} />
          </Field>
          <Field label="Berlaku sampai (opsional)">
            <input type="datetime-local" {...register("endsAt")} />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}

function BannerEditDialog({
  voucher,
  onClose,
  onSaved
}: {
  voucher: Voucher | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<{ bannerLabel: string; bannerPriority: number }>();

  useEffect(() => {
    if (voucher) {
      reset({
        bannerLabel: voucher.banner_label ?? "",
        bannerPriority: voucher.banner_priority
      });
    }
  }, [voucher, reset]);

  if (!voucher) return null;

  async function onSubmit(values: { bannerLabel: string; bannerPriority: number }) {
    try {
      await api.patch(`/vouchers/${voucher!.id}`, {
        bannerLabel: values.bannerLabel.trim() || null,
        bannerPriority: Number(values.bannerPriority) || 0
      });
      toast.success("Banner diperbarui");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  return (
    <Dialog
      open={!!voucher}
      onClose={onClose}
      title={`Edit banner — ${voucher.code}`}
      description="Label ini muncul di banner di atas hero landing page. Kalau kosong, fallback ke deskripsi atau auto-generate."
      maxWidth="480px"
      actions={
        <>
          <Button variant="ghost" onClick={onClose} type="button">
            Batal
          </Button>
          <Button
            type="submit"
            form="banner-edit-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </>
      }
    >
      <form
        id="banner-edit-form"
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "grid", gap: 16 }}
      >
        <Field label="Label banner">
          <input
            {...register("bannerLabel")}
            placeholder="contoh: Diskon Rp 50.000 untuk 50 customer pertama"
            maxLength={120}
          />
        </Field>
        <Field
          label="Prioritas (0 - 1000)"
          hint="Banner dengan prioritas lebih tinggi tampil duluan kalau ada banyak voucher publik aktif."
        >
          <input
            type="number"
            min={0}
            max={1000}
            step={1}
            {...register("bannerPriority", { valueAsNumber: true })}
          />
        </Field>
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
