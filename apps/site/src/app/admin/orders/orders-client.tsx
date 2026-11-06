"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  Loader2,
  MessageCircle,
  Printer,
  RefreshCw,
  Send,
  ShoppingBag,
  Store,
} from "lucide-react";
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
import {
  downloadExcelCsv,
  printBandungShoppingListPdf,
  printShippingLabelPdf,
  type PrintableLabelOrder,
  type ShoppingStoreGroup,
} from "@/lib/admin-exports";

export type AdminOrder = {
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
  voucherCode?: string | null;
  deliveryMethod?: string;
  estimatedKg?: number;
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

export type OrderRequestRow = AdminOrder;

type ListResponse = { items: AdminOrder[]; counts: Record<string, number> };

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
  return `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(text)}`;
}

function detectOrderZone(order: AdminOrder): { key: "bandung" | "jabar" | "samarinda"; label: string } {
  const city = (order.address?.city ?? "").toLowerCase();
  const notes = (order.customerNotes ?? "").toLowerCase();
  if (
    order.tier === "batch" ||
    city.includes("samarinda") ||
    city.includes("balikpapan") ||
    city.includes("tenggarong") ||
    notes.includes("samarinda")
  ) {
    return { key: "samarinda", label: "✈️ Hub Samarinda" };
  }
  if (
    city.includes("bandung") ||
    city.includes("cimahi") ||
    city.includes("lembang") ||
    city.includes("jatinangor") ||
    notes.includes("bandung instant")
  ) {
    return { key: "bandung", label: "🛵 Bandung Instant" };
  }
  return { key: "jabar", label: "🚐 Travel Jabar/JKT" };
}

function parseStoreFromItemName(rawName: string): { cleanName: string; storeName: string } {
  const match = rawName.match(/^(.*?)\s*\[(.*?)\]\s*$/);
  if (match) {
    return { cleanName: match[1].trim(), storeName: match[2].trim() };
  }
  const lower = rawName.toLowerCase();
  if (lower.includes("roti macan")) return { cleanName: rawName, storeName: "Roti Macan Buah Batu" };
  if (lower.includes("tjilaki") || lower.includes("bolu pisang")) return { cleanName: rawName, storeName: "Tjilaki 9 Cihapit" };
  if (lower.includes("roti merak")) return { cleanName: rawName, storeName: "Roti Merak Sadang Serang" };
  if (lower.includes("rochi")) return { cleanName: rawName, storeName: "Rochi Jl. Riau 61" };
  if (lower.includes("studio bolen")) return { cleanName: rawName, storeName: "Studio Bolen Trunojoyo" };
  if (lower.includes("seroja")) return { cleanName: rawName, storeName: "Seroja Bake Pasar Cihapit" };
  if (lower.includes("makjay") || lower.includes("makmur jaya")) return { cleanName: rawName, storeName: "Kopi Makmur Jaya (Makjay)" };
  if (lower.includes("in parfume")) return { cleanName: rawName, storeName: "In Parfume Banceuy" };
  if (lower.includes("basreng")) return { cleanName: rawName, storeName: "Basreng Sultan Bandung" };
  return { cleanName: rawName, storeName: "Toko Bandung Umum" };
}

export function OrdersClient({ initialQueue = "all" }: { initialQueue?: OrderRequestStatus | "all" }) {
  const [queue, setQueue] = useState<OrderRequestStatus | "all">(initialQueue);
  const [viewMode, setViewMode] = useState<"orders" | "shopping_list">("orders");
  const [zoneFilter, setZoneFilter] = useState<"all" | "bandung" | "jabar" | "samarinda">("all");
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
        : d
    );

  const filteredOrders = useMemo(() => {
    const list = data?.items ?? [];
    if (zoneFilter === "all") return list;
    return list.filter((o) => detectOrderZone(o).key === zoneFilter);
  }, [data, zoneFilter]);

  const shoppingGroups: ShoppingStoreGroup[] = useMemo(() => {
    const storeMap = new Map<string, ShoppingStoreGroup["items"]>();
    for (const o of filteredOrders) {
      if (o.status === "cancelled") continue;
      for (const it of o.items) {
        const { cleanName, storeName } = parseStoreFromItemName(it.name);
        const list = storeMap.get(storeName) ?? [];
        const existing = list.find(
          (x) => x.itemName === cleanName && x.variant === (it.variant ?? "")
        );
        const unitRp = it.unitPrice ?? it.maxPrice ?? 50000;
        const oosLabel = OUT_OF_STOCK_LABEL[o.outOfStockPreference] ?? o.outOfStockPreference;
        if (existing) {
          existing.totalQty += it.qty;
          if (!existing.orderCodes.includes(o.code)) existing.orderCodes.push(o.code);
          if (!existing.outOfStockNotes.includes(oosLabel)) existing.outOfStockNotes.push(oosLabel);
        } else {
          list.push({
            itemName: cleanName,
            variant: it.variant ?? "",
            totalQty: it.qty,
            estimatedUnitRp: unitRp,
            orderCodes: [o.code],
            outOfStockNotes: [oosLabel],
          });
        }
        storeMap.set(storeName, list);
      }
    }
    return Array.from(storeMap.entries()).map(([storeName, items]) => ({
      storeName,
      items,
    }));
  }, [filteredOrders]);

  const printableLabels: PrintableLabelOrder[] = useMemo(
    () =>
      filteredOrders.map((o) => ({
        code: o.code,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        city: o.address?.city ?? "Bandung / Jabar / Samarinda",
        street: o.address?.street ?? "",
        zoneLabel: detectOrderZone(o).label,
        deliveryMethod: o.deliveryMethod,
        trackingNumber: o.trackingNumber,
        estimatedKg: o.estimatedKg ?? 1,
        items: o.items.map((it) => ({
          name: it.name,
          variant: it.variant,
          qty: it.qty,
        })),
      })),
    [filteredOrders]
  );

  const handleExportMasterCsv = () => {
    downloadExcelCsv(
      "Master_Pesanan_dan_Laba_Bawabawa.csv",
      [
        "Kode Order",
        "Tanggal",
        "Status",
        "Jalur Pengiriman",
        "Nama Pelanggan",
        "No WA",
        "Kota Tujuan",
        "Daftar Barang",
        "Harga Barang (Modal Toko)",
        "Jasa Titip (Laba)",
        "Ongkir",
        "Total Tagihan",
      ],
      filteredOrders.map((o) => {
        const p = o.quote ?? o.estimate;
        return [
          o.code,
          o.createdAt,
          ORDER_STEP_LABEL[o.status] ?? o.status,
          detectOrderZone(o).label,
          o.customerName,
          o.customerPhone,
          o.address?.city ?? "-",
          o.items.map((i) => `${i.qty}x ${i.name}`).join("; "),
          p?.itemsTotal ?? 0,
          p?.jastipFee ?? 0,
          p?.shippingFee ?? 0,
          p?.total ?? 0,
        ];
      })
    );
  };

  const handleExportShoppingCsv = () => {
    const rows: Array<Array<string | number>> = [];
    for (const g of shoppingGroups) {
      for (const it of g.items) {
        rows.push([
          g.storeName,
          it.itemName,
          it.variant || "-",
          it.totalQty,
          it.estimatedUnitRp,
          it.estimatedUnitRp * it.totalQty,
          it.orderCodes.join("; "),
          it.outOfStockNotes.join("; "),
        ]);
      }
    }
    downloadExcelCsv(
      "Rekap_Belanja_dan_Modal_Toko_Bandung.csv",
      [
        "Toko Bandung",
        "Nama Barang",
        "Varian",
        "Total Qty",
        "Harga Satuan (Rp)",
        "Total Estimasi Modal (Rp)",
        "Kode Order Terkait",
        "Opsi Jika Habis",
      ],
      rows
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar Mode Tampilan & 4 Tombol Output PDF / Excel */}
      <GlassCard className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("orders")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors",
              viewMode === "orders"
                ? "bg-[#24201A] text-[#FCF3E4]"
                : "bg-[hsl(var(--bg))] text-[#24201A] border border-[hsl(var(--border))]"
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Daftar Pesanan ({filteredOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("shopping_list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors",
              viewMode === "shopping_list"
                ? "bg-[#24201A] text-[#FCF3E4]"
                : "bg-[hsl(var(--bg))] text-[#24201A] border border-[hsl(var(--border))]"
            )}
          >
            <Store className="h-3.5 w-3.5" /> Daftar Belanja Toko Bandung ({shoppingGroups.length} Toko)
          </button>
        </div>

        {/* 4 Output Dokumen (2 PDF + 2 Excel/CSV) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => printBandungShoppingListPdf(shoppingGroups)}
          >
            <Printer className="h-3.5 w-3.5" /> PDF Daftar Belanja Bandung
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => printShippingLabelPdf(printableLabels)}
          >
            <Printer className="h-3.5 w-3.5" /> PDF Label Paket
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleExportShoppingCsv}>
            <Download className="h-3.5 w-3.5" /> Excel Belanja Toko
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleExportMasterCsv}>
            <Download className="h-3.5 w-3.5" /> Excel Master Pesanan
          </Button>
        </div>
      </GlassCard>

      {/* Filter 3 Jalur Pengiriman */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">Filter Jalur:</span>
        {[
          { id: "all" as const, label: "Semua Jalur" },
          { id: "bandung" as const, label: "🛵 Jalur 1 · Bandung Instant" },
          { id: "jabar" as const, label: "🚐 Jalur 2 · Travel Jabar & JKT" },
          { id: "samarinda" as const, label: "✈️ Jalur 3 · Hub Samarinda" },
        ].map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setZoneFilter(z.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              zoneFilter === z.id
                ? "border-[hsl(var(--sage-700))] bg-[#F5DFAD] text-[#24201A] font-bold"
                : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))]"
            )}
          >
            {z.label}
          </button>
        ))}
      </div>

      {/* Filter Status Antrean */}
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
                "shrink-0 inline-flex items-center gap-2 rounded-full border px-4 h-9 text-xs sm:text-sm font-semibold",
                queue === q.key
                  ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-700))] text-white"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-2))]"
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

      {viewMode === "shopping_list" ? (
        <div className="space-y-4">
          {shoppingGroups.length === 0 ? (
            <GlassCard className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Belum ada item belanja pada filter ini.
            </GlassCard>
          ) : (
            shoppingGroups.map((g) => (
              <GlassCard key={g.storeName} className="p-5">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-[hsl(var(--sage-700))]" />
                    <h3 className="font-bold text-base text-[#24201A]">{g.storeName}</h3>
                  </div>
                  <Badge variant="neutral">{g.items.length} jenis barang</Badge>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                        <th className="py-2">Barang &amp; Varian</th>
                        <th className="py-2 text-center">Total Qty</th>
                        <th className="py-2 text-right">Est. Modal Toko</th>
                        <th className="py-2 pl-4">Kode Order</th>
                        <th className="py-2">Opsi Jika Habis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                      {g.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-semibold text-[#24201A]">
                            {it.itemName}
                            {it.variant && (
                              <span className="block text-xs font-normal text-[hsl(var(--muted-foreground))]">
                                Varian: {it.variant}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-center font-extrabold text-base">{it.totalQty}</td>
                          <td className="py-2.5 text-right tabular-nums font-semibold">
                            {formatIDR(it.estimatedUnitRp * it.totalQty)}
                          </td>
                          <td className="py-2.5 pl-4 font-mono text-xs">{it.orderCodes.join(", ")}</td>
                          <td className="py-2.5 text-xs text-[#9E3B34]">{it.outOfStockNotes.join(" / ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      ) : !data && !error ? (
        <Card className="p-10 flex justify-center text-sm text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden /> Memuat…
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Tidak ada pesanan di antrean ini. 🎉
        </Card>
      ) : (
        <ul className="space-y-3">
          {filteredOrders.map((o) => (
            <li key={o.id}>
              <OrderRow
                order={o}
                open={openId === o.id}
                onToggle={() => setOpenId(openId === o.id ? null : o.id)}
                onChange={replace}
              />
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
  const zone = detectOrderZone(order);
  return (
    <GlassCard className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full text-left p-4 sm:p-5 flex flex-wrap items-center gap-3"
      >
        <div className="flex-1 min-w-[12rem]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-[#24201A]">{order.code}</span>
            <span className="rounded-full bg-[#F5DFAD] px-2.5 py-0.5 text-[11px] font-bold text-[#24201A]">
              {zone.label}
            </span>
          </div>
          <p className="text-sm font-semibold mt-1">
            {order.customerName}{" "}
            <span className="font-normal text-[hsl(var(--muted-foreground))]">· {order.address.city}</span>
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {formatDateTime(order.createdAt)} · {order.items.length} barang
          </p>
        </div>
        <Badge variant={STATUS_BADGE[order.status]}>{ORDER_STEP_LABEL[order.status]}</Badge>
        {pricing && (
          <span className="tabular-nums font-bold text-[hsl(var(--sage-700))]">
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
  const zone = detectOrderZone(order);

  return (
    <div className="border-t border-[hsl(var(--border))] p-4 sm:p-5 grid gap-5 lg:grid-cols-2">
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="font-semibold">Barang Titipan Bandung</h3>
          <ul className="mt-2 space-y-2">
            {order.items.map((it, i) => (
              <li key={i} className="rounded-xl border border-[hsl(var(--border))] p-3">
                <p className="font-medium">
                  {it.name} × {it.qty}
                  {it.variant ? <span className="text-[hsl(var(--muted-foreground))]"> · {it.variant}</span> : null}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {it.unitPrice != null
                    ? `Harga katalog ${formatIDR(it.unitPrice)}`
                    : it.maxPrice
                    ? `Est. Harga ${formatIDR(it.maxPrice)} / pcs`
                    : ""}
                </p>
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
          <h3 className="font-semibold">Pelanggan &amp; Aksi Cepat</h3>
          <p className="mt-1">
            {order.customerName} · {order.customerPhone}
          </p>
          <p className="text-[hsl(var(--muted-foreground))]">
            {order.address.street}, {order.address.city} {order.address.postal}
            {order.address.notes ? ` (${order.address.notes})` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <a
                href={waTo(
                  order.customerPhone,
                  `Halo Kak ${order.customerName}, kami dari Admin Bawabawa.id mengonfirmasi pesanan #${order.code} (${zone.label}). Stok barang tersedia di toko Bandung, silakan lanjut pembayaran via Transfer BCA/Mandiri atau QRIS di link: https://bawabawa-id.vercel.app/track/${order.trackingToken}`
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" aria-hidden /> Konfirmasi WA + Tagihan
              </a>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                printShippingLabelPdf([
                  {
                    code: order.code,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    city: order.address?.city ?? "Tujuan",
                    street: order.address?.street ?? "",
                    zoneLabel: zone.label,
                    deliveryMethod: order.deliveryMethod,
                    trackingNumber: order.trackingNumber,
                    estimatedKg: order.estimatedKg ?? 1,
                    items: order.items,
                  },
                ])
              }
            >
              <Printer className="h-4 w-4" aria-hidden /> Cetak Label PDF
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href={`/track/${order.trackingToken}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden /> Halaman Pelanggan
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {order.allowedNext.includes("quoted") && (
          <QuoteForm order={order} busy={busy} onSubmit={(body) => void post("quote", body)} />
        )}

        {transitions.length > 0 && (
          <div className="rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3">
            <h3 className="font-semibold text-sm">Update Status Pesanan</h3>
            {transitions.includes("shipped") && (
              <div className="grid gap-1.5">
                <Label htmlFor={`resi-${order.id}`}>No. Resi / Pool Travel / Kloter</Label>
                <Input
                  id={`resi-${order.id}`}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Contoh: Cititrans 14.00 / Kloter SMD-01"
                />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor={`note-${order.id}`}>Catatan untuk pelanggan (opsional)</Label>
              <Input
                id={`note-${order.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Sudah dibelikan fresh pagi di Buah Batu"
              />
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
  const fee = jastipFee ? num(jastipFee) : goods > 0 ? Math.max(20000, Math.round(goods * 0.1)) : 0;
  const ship = num(shippingFee);
  const ppn = withPpn ? Math.round((fee + ship) * 0.11) : 0;

  return (
    <form
      className="rounded-2xl border border-[hsl(var(--warning)/0.5)] p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          itemsTotal: goods,
          shippingFee: ship,
          jastipFee: jastipFee ? fee : undefined,
          withPpn,
          note: note.trim() || undefined,
        });
      }}
    >
      <h3 className="font-semibold text-sm">
        {order.status === "quoted" ? "Revisi Tagihan Final" : "Tetapkan Tagihan Final"}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`goods-${order.id}`}>Total Harga Barang Toko</Label>
          <Input
            id={`goods-${order.id}`}
            inputMode="numeric"
            value={itemsTotal}
            onChange={(e) => setItemsTotal(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`ship-${order.id}`}>Ongkir</Label>
          <Input
            id={`ship-${order.id}`}
            inputMode="numeric"
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`fee-${order.id}`}>Jasa Titip (Laba)</Label>
          <Input
            id={`fee-${order.id}`}
            inputMode="numeric"
            value={jastipFee}
            onChange={(e) => setJastipFee(e.target.value)}
            placeholder={String(fee)}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`qnote-${order.id}`}>Catatan untuk pelanggan</Label>
        <Textarea
          id={`qnote-${order.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Stok tersedia di toko Bandung. Silakan transfer ke BCA/Mandiri atau scan QRIS."
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">
          Total: <strong className="tabular-nums">{formatIDR(goods + fee + ship + ppn)}</strong>
        </p>
        <Button type="submit" size="sm" variant="accent" disabled={busy || goods <= 0}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}{" "}
          Simpan Tagihan
        </Button>
      </div>
    </form>
  );
}
