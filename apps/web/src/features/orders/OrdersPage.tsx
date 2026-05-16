import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AppShell } from "../../shared/ui/shell/AppShell";
import { Button, Dialog, GlassCard } from "../../shared/ui/primitives";
import { api } from "../../shared/api/client";

/**
 * Channels that can originate an order. Mirrors the `source_channel`
 * enum in apps/api `orders.service.ts` so the API rejects any drift.
 */
const CHANNELS = [
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "dm", label: "DM (TikTok / lainnya)" },
  { value: "telepon", label: "Telepon" },
  { value: "email", label: "Email" },
  { value: "marketplace", label: "Marketplace (Tokopedia/Shopee)" },
  { value: "walkin", label: "Walk-in" },
  { value: "lainnya", label: "Lainnya" }
] as const;

type ChannelValue = (typeof CHANNELS)[number]["value"];

type Branch = { id: string; code: string; name: string };

type Order = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: "pending" | "dp" | "paid";
  status: string;
  sourceChannel: string;
  notes: string | null;
  createdAt: string;
};

type ManualOrderForm = {
  customerName: string;
  customerPhone: string;
  branchId: string;
  totalAmount: number;
  sourceChannel: ChannelValue;
  notes: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  payment_pending: "Menunggu pembayaran",
  payment_dp: "DP diterima",
  payment_paid: "Lunas",
  stock_reserved: "Stok dipesan",
  packed: "Dikemas",
  shipped: "Dikirim",
  invoiced: "Invoiced",
  posted_finance: "Posted ke finance",
  cancelled: "Dibatalkan"
};

const CHANNEL_LABEL: Record<string, string> = Object.fromEntries(
  CHANNELS.map((c) => [c.value, c.label])
);
CHANNEL_LABEL.web = "Web checkout";

function formatIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const reload = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; data: Order[] }>("/orders");
      setOrders(Array.isArray(response.data?.data) ? response.data.data : []);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat daftar order";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    api
      .get<{ success: boolean; data: Branch[] }>("/branches")
      .then((response) => setBranches(response.data?.data ?? []))
      .catch(() => setBranches([]));
  }, [reload]);

  const filtered = useMemo(() => {
    if (channelFilter === "all") return orders;
    return orders.filter((o) => o.sourceChannel === channelFilter);
  }, [orders, channelFilter]);

  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      counts[o.sourceChannel] = (counts[o.sourceChannel] ?? 0) + 1;
    }
    return counts;
  }, [orders]);

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
              <h1 style={{ margin: 0 }}>Orders</h1>
              <p style={{ marginTop: 8, color: "var(--color-muted)", fontSize: 14 }}>
                Daftar order. Order dari web checkout masuk otomatis. Order
                yang masuk via Instagram / WhatsApp / telepon / walk-in dapat
                diinput manual lewat tombol di kanan.
              </p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={branches.length === 0}
              title={
                branches.length === 0
                  ? "Tidak ada branch tersedia. Hubungi admin sistem."
                  : undefined
              }
            >
              + Tambah Order Manual
            </Button>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 8,
              flexWrap: "wrap"
            }}
          >
            <FilterPill
              active={channelFilter === "all"}
              onClick={() => setChannelFilter("all")}
              label={`Semua (${orders.length})`}
            />
            {Object.entries(channelCounts).map(([channel, count]) => (
              <FilterPill
                key={channel}
                active={channelFilter === channel}
                onClick={() => setChannelFilter(channel)}
                label={`${CHANNEL_LABEL[channel] ?? channel} (${count})`}
              />
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            {loading ? (
              <p style={{ color: "var(--color-muted)" }}>Memuat order…</p>
            ) : error ? (
              <p style={{ color: "var(--color-danger, #b91c1c)" }}>{error}</p>
            ) : filtered.length === 0 ? (
              <EmptyState onAdd={() => setDialogOpen(true)} disabled={branches.length === 0} />
            ) : (
              <OrdersTable orders={filtered} />
            )}
          </div>
        </GlassCard>
      </motion.section>

      <ManualOrderDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        branches={branches}
        onCreated={() => {
          setDialogOpen(false);
          void reload();
        }}
      />
    </AppShell>
  );
}

function FilterPill({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        border: active ? "1px solid var(--color-text-strong)" : "1px solid var(--color-border, rgba(0,0,0,.12))",
        background: active ? "var(--color-text-strong)" : "transparent",
        color: active ? "var(--color-surface, #fff)" : "var(--color-text)",
        fontSize: 13,
        cursor: "pointer"
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({
  onAdd,
  disabled
}: {
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <div
      style={{
        border: "1px dashed var(--color-border, rgba(0,0,0,.16))",
        borderRadius: 12,
        padding: "32px 24px",
        textAlign: "center"
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>Belum ada order</p>
      <p style={{ margin: "8px 0 16px", color: "var(--color-muted)", fontSize: 14 }}>
        Order dari web checkout akan muncul otomatis di sini. Kalau ada yang
        memesan via Instagram / WhatsApp / telepon, input manual dulu supaya
        masuk ke pipeline.
      </p>
      <Button onClick={onAdd} disabled={disabled}>
        + Tambah Order Manual
      </Button>
    </div>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--color-muted)" }}>
            <Th>Order #</Th>
            <Th>Tanggal</Th>
            <Th>Channel</Th>
            <Th>Status</Th>
            <Th align="right">Total</Th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} style={{ borderTop: "1px solid var(--color-border, rgba(0,0,0,.08))" }}>
              <Td>
                <strong>{order.orderNumber}</strong>
                {order.notes ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-muted)",
                      maxWidth: 320,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                    title={order.notes}
                  >
                    {order.notes}
                  </div>
                ) : null}
              </Td>
              <Td>{formatDate(order.createdAt)}</Td>
              <Td>{CHANNEL_LABEL[order.sourceChannel] ?? order.sourceChannel}</Td>
              <Td>{STATUS_LABEL[order.status] ?? order.status}</Td>
              <Td align="right">{formatIDR(order.totalAmount)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

function ManualOrderDialog({
  open,
  onClose,
  branches,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  onCreated: () => void;
}) {
  const defaultBranch = branches[0]?.id ?? "";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ManualOrderForm>({
    defaultValues: {
      customerName: "",
      customerPhone: "",
      branchId: defaultBranch,
      totalAmount: 0,
      sourceChannel: "instagram",
      notes: ""
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        customerName: "",
        customerPhone: "",
        branchId: defaultBranch,
        totalAmount: 0,
        sourceChannel: "instagram",
        notes: ""
      });
    }
  }, [open, reset, defaultBranch]);

  async function onSubmit(values: ManualOrderForm) {
    try {
      await api.post("/orders/manual", {
        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone.trim(),
        branchId: values.branchId,
        totalAmount: Number(values.totalAmount),
        sourceChannel: values.sourceChannel,
        notes: values.notes.trim() || null
      });
      toast.success("Order manual berhasil dibuat");
      onCreated();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal membuat order";
      toast.error(message);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tambah Order Manual"
      description="Catat order yang masuk dari Instagram / WhatsApp / telepon / walk-in supaya masuk ke pipeline yang sama dengan order web."
      maxWidth="560px"
      actions={
        <>
          <Button variant="ghost" onClick={onClose} type="button">
            Batal
          </Button>
          <Button
            type="submit"
            form="manual-order-form"
            disabled={isSubmitting || branches.length === 0}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan order"}
          </Button>
        </>
      }
    >
      <form
        id="manual-order-form"
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "grid", gap: 16 }}
      >
        <Field label="Nama customer" error={errors.customerName?.message}>
          <input
            {...register("customerName", { required: "Wajib diisi" })}
            placeholder="contoh: Bu Sari Wulandari"
          />
        </Field>

        <Field label="Nomor WhatsApp / telepon" error={errors.customerPhone?.message}>
          <input
            {...register("customerPhone", {
              required: "Wajib diisi",
              minLength: { value: 6, message: "Minimal 6 digit" }
            })}
            placeholder="08xxxxxxxxxx"
            inputMode="tel"
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Channel" error={errors.sourceChannel?.message}>
            <select {...register("sourceChannel", { required: true })}>
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Branch" error={errors.branchId?.message}>
            <select {...register("branchId", { required: "Pilih branch" })}>
              {branches.length === 0 ? (
                <option value="">— tidak ada branch —</option>
              ) : (
                branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))
              )}
            </select>
          </Field>
        </div>

        <Field label="Total (IDR)" error={errors.totalAmount?.message}>
          <input
            type="number"
            min={1}
            step={1000}
            {...register("totalAmount", {
              required: "Wajib diisi",
              valueAsNumber: true,
              min: { value: 1, message: "Total harus > 0" }
            })}
            placeholder="200000"
          />
        </Field>

        <Field
          label="Catatan (opsional)"
          hint="Detail item, alamat, request packing, dll. Disimpan di order untuk konteks admin."
        >
          <textarea
            rows={3}
            {...register("notes")}
            placeholder="contoh: 2 sepatu Compass size 42 + minta packing dobel bubblewrap"
          />
        </Field>

        <p style={{ margin: 0, fontSize: 12, color: "var(--color-muted)" }}>
          Tip: order yang sudah dibuat masih bisa diatur status (DP / lunas /
          dikirim / dst) lewat workflow biasa.
        </p>
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
        <span style={{ color: "var(--color-danger, #b91c1c)", fontSize: 12 }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
