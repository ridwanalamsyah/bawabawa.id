"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, MessageCircle, RefreshCw, Send } from "lucide-react";
import { Card, GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn, formatDateTime, formatIDR } from "@/lib/utils";
import { TIERS, type PricingBreakdown, type TierId } from "@/lib/pricing";
import {
  ORDER_STEP_LABEL,
  OUT_OF_STOCK_LABEL,
  STATUS_BADGE,
  errorMessage,
  type OrderRequestStatus,
} from "@/lib/order-requests";

type AdminOrder = {
  id: string;
  code: string;
  trackingToken: string;
  source: "request" | "catalog";
  status: OrderRequestStatus;
  customerName: string;
  customerPhone: string;
  address: { street?: string; city?: string; postal?: string; notes?: string };
  tier: TierId;
  tripId: string | null;
  items: Array<{
    name: string;
    link?: string;
    qty: number;
    maxPrice?: number;
    unitPrice?: number;
    variant?: string;
    notes?: string;
    category?: string;
  }>;
  outOfStockPreference: string;
  customerNotes: string | null;
  estimate: PricingBreakdown | null;
  quote: PricingBreakdown | null;
  quoteNote: string | null;
  trackingNumber: string | null;
  history: Array<{ status: OrderRequestStatus; at: string; note: string | null }>;
  allowedNext: OrderRequestStatus[];
  createdAt: string;
};

type ListResponse = { items: AdminOrder[]; counts: Record<string, number> };

/** Work queues in the order the team handles them. */
const QUEUES: Array<{ key: OrderRequestStatus | "all"; label: string }> = [
  { key: "submitted", label: "Perlu dicek" },
  { key: "quoted", label: "Menunggu persetujuan" },
  { key: "approved", label: "Menunggu bayar" },
  { key: "paid", label: "Siap dibelikan" },
  { key: "purchasing", label: "Dibelikan" },
  { key: "packed", label: "Siap kirim" },
  { key: "shipped", label: "Dikirim" },
  { key: "all", label: "Semua" },
];

const NEXT_ACTION_LABEL: Partial<Record<OrderRequestStatus, string>> = {
  paid: "Tandai sudah dibayar",
  purchasing: "Mulai belanja",
  packed: "Sudah dikemas",
  shipped: "Kirim (isi resi)",
  delivered: "Tandai diterima",
  cancelled: "Batalkan",
};

function waTo(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function OrdersClient({ initialQueue = "submitted" }: { initialQueue?: OrderRequestStatus | "all" }) {
  const [queue, setQueue] = useState<OrderRequestStatus | "all">(initialQueue);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = queue === "all" ? "" : `?status=${queue}`;
      const res = await fetch(`/api/admin/order-requests${qs}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(errorMessage(json, `Gagal memuat (${res.status})`));
        return;
      }
      setData(json as ListResponse);
    } catch {
      setError("Koneksi ke server gagal.");
    } finally {
      setLoading(false);
    }
  }, [queue]);

  useEffect(() => {
    // Refetch when the queue tab changes; state is set after the request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const replace = (order: AdminOrder) =>
    setData((d) =>
      d
        ? {
            ...d,
            items:
              queue === "all" || order.status === queue
                ? d.items.map((o) => (o.id === order.id ? order : o))
                : d.items.filter((o) => o.id !== order.id),
          }
        : d,
    );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Antrean pesanan">
        {QUEUES.map((q) => {
          const count = q.key === "all" ? undefined : data?.counts?.[q.key];
          return (
            <button
              key={q.key}
              type="button"
              role="tab"
              aria-selected={queue === q.key}
              onClick={() => setQueue(q.key)}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 rounded-full border px-4 h-9 text-sm",
                queue === q.key
                  ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-700))] text-white"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-2))]",
              )}
            >
              {q.label}
              {count ? (
                <span className={cn("rounded-full px-1.5 text-xs", queue === q.key ? "bg-white/20" : "bg-[hsl(var(--surface-2))]")}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
        <Button variant="ghost" size="sm" onClick={() => void load()} className="shrink-0" aria-label="Muat ulang">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
        </Button>
      </div>

      {error && (
        <Card className="p-4 text-sm text-[hsl(var(--danger))]" role="alert">
          {error}
        </Card>
      )}

      {!data && !error ? (
        <Card className="p-10 flex justify-center text-sm text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden /> Memuat…
        </Card>
      ) : data && data.items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Tidak ada pesanan di antrean ini. 🎉
        </Card>
      ) : (
        <ul className="space-y-3">
          {data?.items.map((o) => (
            <li key={o.id}>
              <OrderRow order={o} open={openId === o.id} onToggle={() => setOpenId(openId === o.id ? null : o.id)} onChange={replace} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderRow({
  order,
  open,
  onToggle,
  onChange,
}: {
  order: AdminOrder;
  open: boolean;
  onToggle: () => void;
  onChange: (o: AdminOrder) => void;
}) {
  const pricing = order.quote ?? order.estimate;
  return (
    <GlassCard className="p-0 overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full text-left p-4 sm:p-5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[12rem]">
          <p className="font-mono font-medium">
            {order.code} <span className="text-xs font-sans text-[hsl(var(--muted-foreground))]">· {order.source === "catalog" ? "Katalog" : "Request"}</span>
          </p>
          <p className="text-sm">
            {order.customerName} <span className="text-[hsl(var(--muted-foreground))]">· {order.address.city}</span>
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {formatDateTime(order.createdAt)} · {order.items.length} barang · {TIERS[order.tier]?.label}
          </p>
        </div>
        <Badge variant={STATUS_BADGE[order.status]}>{ORDER_STEP_LABEL[order.status]}</Badge>
        {pricing && (
          <span className="tabular-nums font-medium">
            {order.quote ? "" : "≤ "}
            {formatIDR(pricing.total)}
          </span>
        )}
      </button>
      {open && <OrderDetail order={order} onChange={onChange} />}
    </GlassCard>
  );
}

function OrderDetail({ order, onChange }: { order: AdminOrder; onChange: (o: AdminOrder) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [note, setNote] = useState("");

  const post = async (path: string, body: unknown) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/order-requests/${order.id}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(errorMessage(json, `Gagal (${res.status})`));
        return;
      }
      onChange(json as AdminOrder);
      setNote("");
    } catch {
      setErr("Koneksi gagal.");
    } finally {
      setBusy(false);
    }
  };

  const transitions = order.allowedNext.filter((s) => s !== "quoted");

  return (
    <div className="border-t border-[hsl(var(--border))] p-4 sm:p-5 grid gap-5 lg:grid-cols-2">
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="font-semibold">Barang</h3>
          <ul className="mt-2 space-y-2">
            {order.items.map((it, i) => (
              <li key={i} className="rounded-xl border border-[hsl(var(--border))] p-3">
                <p className="font-medium">
                  {it.name} × {it.qty}
                  {it.variant ? <span className="text-[hsl(var(--muted-foreground))]"> · {it.variant}</span> : null}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {it.unitPrice != null ? `Harga katalog ${formatIDR(it.unitPrice)}` : it.maxPrice ? `Maks ${formatIDR(it.maxPrice)} / pcs` : ""}
                  {it.category ? ` · ${it.category}` : ""}
                </p>
                {it.link && (
                  <a href={it.link} target="_blank" rel="noopener noreferrer nofollow" className="text-xs underline inline-flex items-center gap-1 break-all">
                    <ExternalLink className="h-3 w-3" aria-hidden /> {it.link}
                  </a>
                )}
                {it.notes && <p className="mt-1 text-xs">“{it.notes}”</p>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            Kalau habis: {OUT_OF_STOCK_LABEL[order.outOfStockPreference] ?? order.outOfStockPreference}
          </p>
          {order.customerNotes && <p className="mt-1 text-xs">Pesan pelanggan: “{order.customerNotes}”</p>}
        </div>
        <div>
          <h3 className="font-semibold">Pelanggan</h3>
          <p className="mt-1">
            {order.customerName} · {order.customerPhone}
          </p>
          <p className="text-[hsl(var(--muted-foreground))]">
            {order.address.street}, {order.address.city} {order.address.postal}
            {order.address.notes ? ` (${order.address.notes})` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={waTo(order.customerPhone, `Halo ${order.customerName}, kami dari Bawabawa soal pesanan ${order.code}.`)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href={`/track/${order.trackingToken}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden /> Halaman pelanggan
              </a>
            </Button>
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Riwayat</h3>
          <ol className="mt-2 space-y-1 text-xs">
            {order.history.map((h, i) => (
              <li key={i}>
                <span className="text-[hsl(var(--muted-foreground))]">{formatDateTime(h.at)}</span> — {ORDER_STEP_LABEL[h.status]}
                {h.note ? `: ${h.note}` : ""}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="space-y-4">
        {order.allowedNext.includes("quoted") && <QuoteForm order={order} busy={busy} onSubmit={(body) => void post("quote", body)} />}

        {transitions.length > 0 && (
          <div className="rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3">
            <h3 className="font-semibold text-sm">Update status</h3>
            {transitions.includes("shipped") && (
              <div className="grid gap-1.5">
                <Label htmlFor={`resi-${order.id}`}>No. resi / kode trip</Label>
                <Input id={`resi-${order.id}`} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="JNE1234567890" />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor={`note-${order.id}`}>Catatan untuk pelanggan (opsional)</Label>
              <Input id={`note-${order.id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: berat aktual 1,2 kg" />
            </div>
            <div className="flex flex-wrap gap-2">
              {transitions.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === "cancelled" ? "ghost" : "primary"}
                  disabled={busy || (s === "shipped" && !trackingNumber.trim())}
                  onClick={() => {
                    if (s === "cancelled" && !window.confirm(`Batalkan ${order.code}?`)) return;
                    void post("status", {
                      status: s,
                      note: note.trim() || undefined,
                      trackingNumber: s === "shipped" ? trackingNumber.trim() : undefined,
                    });
                  }}
                >
                  {NEXT_ACTION_LABEL[s] ?? ORDER_STEP_LABEL[s]}
                </Button>
              ))}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Pelanggan otomatis dikabari lewat WhatsApp (jika Fonnte aktif).</p>
          </div>
        )}
        {err && (
          <p role="alert" className="text-sm text-[hsl(var(--danger))]">
            {err}
          </p>
        )}
      </div>
    </div>
  );
}

function QuoteForm({
  order,
  busy,
  onSubmit,
}: {
  order: AdminOrder;
  busy: boolean;
  onSubmit: (body: { itemsTotal: number; shippingFee: number; jastipFee?: number; withPpn: boolean; note?: string }) => void;
}) {
  const base = order.quote ?? order.estimate;
  const [itemsTotal, setItemsTotal] = useState(String(base?.itemsTotal ?? ""));
  const [shippingFee, setShippingFee] = useState(String(base?.shippingFee ?? ""));
  const [jastipFee, setJastipFee] = useState("");
  const [withPpn, setWithPpn] = useState(false);
  const [note, setNote] = useState(order.quoteNote ?? "");
  const num = (v: string) => Number(v.replace(/\D/g, "")) || 0;
  const goods = num(itemsTotal);
  const fee = jastipFee ? num(jastipFee) : goods > 0 ? Math.max(20000, Math.round(goods * 0.08)) : 0;
  const ship = num(shippingFee);
  const ppn = withPpn ? Math.round((fee + ship) * 0.11) : 0;

  return (
    <form
      className="rounded-2xl border border-[hsl(var(--warning)/0.5)] p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ itemsTotal: goods, shippingFee: ship, jastipFee: jastipFee ? fee : undefined, withPpn, note: note.trim() || undefined });
      }}
    >
      <h3 className="font-semibold text-sm">{order.status === "quoted" ? "Revisi penawaran" : "Kirim penawaran harga"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`goods-${order.id}`}>Total harga barang</Label>
          <Input id={`goods-${order.id}`} inputMode="numeric" value={itemsTotal} onChange={(e) => setItemsTotal(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`ship-${order.id}`}>Ongkir</Label>
          <Input id={`ship-${order.id}`} inputMode="numeric" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`fee-${order.id}`}>Jasa titip (kosong = 8%)</Label>
          <Input id={`fee-${order.id}`} inputMode="numeric" value={jastipFee} onChange={(e) => setJastipFee(e.target.value)} placeholder={String(fee)} />
        </div>
        <label className="flex items-center gap-2 text-sm mt-6">
          <input type="checkbox" checked={withPpn} onChange={(e) => setWithPpn(e.target.checked)} /> PPN 11% (jasa + ongkir)
        </label>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`qnote-${order.id}`}>Catatan untuk pelanggan</Label>
        <Textarea id={`qnote-${order.id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Stok ada, warna hitam ukuran 40. Berat ±1,2 kg." />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">
          Total: <strong className="tabular-nums">{formatIDR(goods + fee + ship + ppn)}</strong>
        </p>
        <Button type="submit" size="sm" variant="accent" disabled={busy || goods <= 0}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />} Kirim ke pelanggan
        </Button>
      </div>
    </form>
  );
}
