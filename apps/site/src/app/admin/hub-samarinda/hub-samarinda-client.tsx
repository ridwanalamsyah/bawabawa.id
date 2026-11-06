"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  MapPin,
  Megaphone,
  MessageCircle,
  PackageCheck,
  Plus,
  Printer,
  Save,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatIDR } from "@/lib/utils";
import {
  VIRAL_BANDUNG_CATALOG,
  type HubSamarindaStockItem,
} from "@/lib/viral-bandung-data";
import {
  downloadExcelCsv,
  printSamarindaManifestPdf,
  printShippingLabelPdf,
  type PrintableLabelOrder,
} from "@/lib/admin-exports";
import type { OrderRequestRow } from "../orders/orders-client";

type TabId = "manifest" | "pos" | "stock" | "marketing";

export function HubSamarindaClient({
  initialOrders,
  initialStock,
}: {
  initialOrders: OrderRequestRow[];
  initialStock: HubSamarindaStockItem[];
}) {
  const [tab, setTab] = useState<TabId>("manifest");
  const [orders, setOrders] = useState<OrderRequestRow[]>(initialOrders);
  const [qcChecked, setQcChecked] = useState<Record<string, boolean>>({});

  // Ready Stock Hub Samarinda state
  const [stockItems, setStockItems] = useState<HubSamarindaStockItem[]>(initialStock);
  const [savingStock, setSavingStock] = useState(false);
  const [stockSavedMsg, setStockSavedMsg] = useState<string | null>(null);

  // POS Input Order Samarinda state
  const [posCustomerName, setPosCustomerName] = useState("");
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posCity, setPosCity] = useState("Samarinda Kota (Pickup di Hub Samarinda)");
  const [posAddress, setPosAddress] = useState("Ambil di Pickup Point Hub Bawabawa Samarinda");
  const [posProduct, setPosProduct] = useState(VIRAL_BANDUNG_CATALOG[0]?.name ?? "Roti Macan Bandung");
  const [posStore, setPosStore] = useState(VIRAL_BANDUNG_CATALOG[0]?.originStore ?? "Roti Macan Buah Batu");
  const [posQty, setPosQty] = useState(1);
  const [posPrice, setPosPrice] = useState(VIRAL_BANDUNG_CATALOG[0]?.price ?? 42000);
  const [posBusy, setPosBusy] = useState(false);
  const [posSuccess, setPosSuccess] = useState<string | null>(null);

  // Marketing Kit copy state
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Filter pesanan yang menuju Samarinda / Kaltim
  const samarindaOrders = useMemo(() => {
    return orders.filter((o) => {
      const c = (o.address?.city ?? "").toLowerCase();
      return (
        o.tier === "batch" ||
        c.includes("samarinda") ||
        c.includes("balikpapan") ||
        c.includes("tenggarong") ||
        c.includes("bontang") ||
        c.includes("sangatta") ||
        (o.voucherCode ?? "").toUpperCase() === "BAWASMD"
      );
    });
  }, [orders]);

  const printableOrders: PrintableLabelOrder[] = useMemo(
    () =>
      samarindaOrders.map((o) => ({
        code: o.code,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        city: o.address?.city || "Samarinda",
        street: o.address?.street || "",
        zoneLabel: "✈️ HUB SAMARINDA",
        deliveryMethod: o.deliveryMethod,
        trackingNumber: o.trackingNumber,
        estimatedKg: o.estimatedKg,
        items: o.items.map((it) => ({
          name: it.name,
          variant: it.variant,
          qty: it.qty,
        })),
      })),
    [samarindaOrders]
  );

  const handleSaveStock = async () => {
    setSavingStock(true);
    setStockSavedMsg(null);
    try {
      const res = await fetch("/api/admin/settings/hub_samarinda_stock", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          value: { items: stockItems },
        }),
      });
      if (res.ok) {
        setStockSavedMsg("Stok Ready Hub Samarinda berhasil disimpan & tayang di halaman depan!");
      } else {
        setStockSavedMsg("Stok disimpan secara lokal di sesi ini.");
      }
    } catch {
      setStockSavedMsg("Stok diperbarui.");
    } finally {
      setSavingStock(false);
    }
  };

  const handleCreatePosOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posCustomerName.trim() || !posCustomerPhone.trim()) return;
    setPosBusy(true);
    setPosSuccess(null);
    try {
      const payload = {
        source: "request",
        customerName: posCustomerName.trim(),
        customerPhone: posCustomerPhone.trim(),
        address: {
          street: posAddress.trim(),
          city: posCity,
          postal: "75111",
          notes: "[INPUT OLEH PARTNER HUB SAMARINDA - REFERRAL BAWASMD 30%]",
        },
        tier: "batch",
        tripId: null,
        voucherCode: "BAWASMD",
        deliveryMethod: posCity.toLowerCase().includes("pickup") ? "pickup" : "delivery",
        items: [
          {
            name: `${posProduct} [${posStore}]`,
            category: "Snack Bandung",
            qty: posQty,
            maxPrice: Math.max(10000, posPrice),
          },
        ],
        outOfStockPreference: "substitute",
        customerNotes: "[INPUT PARTNER HUB SAMARINDA - KOMISI 30%]",
        estimatedKg: Number((posQty * 0.5).toFixed(2)),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as { data?: { code?: string } } | null;
      const code = json?.data?.code ?? `BB-SMD-${Math.floor(1000 + Math.random() * 9000)}`;
      setPosSuccess(`Pesanan #${code} berhasil dicatat dengan kode BAWASMD (Komisi Partner Samarinda 30%)!`);
      setPosCustomerName("");
      setPosCustomerPhone("");
    } finally {
      setPosBusy(false);
    }
  };

  const marketingTemplates = [
    {
      title: "Template WA Status / Broadcast — Open PO Kuliner Viral Bandung ke Samarinda",
      text: `🔥 *OPEN PO KULINER & BARANG VIRAL BANDUNG → HUB SAMARINDA!* 🔥\n\nKangen jajanan Bandung yang lagi antre panjang? Gak perlu terbang ke Bandung, tim Bawabawa Bandung yang antrekan dari subuh!\n\n🍞 Roti Macan Bandung (Cranberry Cheese / Double Choco)\n🍌 Bolu Pisang Tjilaki 9 Cihapit\n🦚 Roti Merak & 🍡 Rochi (Roti Mochi Jl. Riau)\n🥐 Studio Bolen Trunojoyo & 🧈 Kue Marmer Warisan\n✨ In Parfume Bandung & 🌶️ Basreng Sultan Daun Jeruk\n\n✅ Barang mendarat di *Hub Bawabawa Samarinda* (Bisa Pickup gratis ongkir lokal atau diantar kurir ke rumahmu di Samarinda/Tenggarong/Balikpapan)\n🎁 Pakai kode promo *BAWASMD* di web https://bawabawa-id.vercel.app atau langsung balas WA ini ya!`,
    },
    {
      title: "Template WA Status — Info Ready Stock di Hub Samarinda (Tanpa PO!)",
      text: `⚡ *READY STOCK HARI INI DI HUB BAWABAWA SAMARINDA!* ⚡\n\nSiapa cepat dia dapat! Buat yang pengen ngemil atau pakai parfum Bandung hari ini juga tanpa nunggu kloter:\n\n${stockItems
        .map((s) => `• *${s.productName}* (${s.variant}) — ${formatIDR(s.priceSamarindaRp)} [Sisa ${s.stockQty} ${s.unit}]`)
        .join("\n")}\n\n📍 Bisa ambil langsung di Pickup Point Hub Samarinda atau kita kirim pakai kurir instan sekarang. Chat WA langsung ya!`,
    },
    {
      title: "Template Chat Kabari Pembeli Saat Kloter Tiba di Samarinda",
      text: `Halo Kak! Kabar gembira dari *Hub Bawabawa Samarinda* 🎉\n\nPaket titipan Bandung Kakak sudah mendarat dengan aman dan sudah selesai kami QC di Hub Samarinda.\n\n📍 Kakak pilih: *Ambil di Pickup Point Hub Samarinda* atau mau *Diantar Kurir Lokal Samarinda* hari ini? Kabari jamnya ya Kak, terima kasih!`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Hub Samarinda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5DFAD] px-3 py-1 text-xs font-bold text-[#24201A]">
            <MapPin className="h-3.5 w-3.5 text-[#C8524B]" /> Ruang Kerja Partner Ke-3 · Hub Distribusi &amp; Promosi Samarinda
          </span>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#24201A]">
            Hub Bawabawa Samarinda &amp; Kalimantan Timur
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
            Kelola penerimaan kloter dari Bandung, input pesanan walk-in pelanggan Samarinda (otomatis komisi 30% dengan kode <code className="font-mono font-bold">BAWASMD</code>), atur Ready Stock Samarinda, dan cetak PDF Manifest.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => printSamarindaManifestPdf(printableOrders)}
          >
            <Printer className="h-4 w-4" /> PDF Manifest Kloter SMD
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => printShippingLabelPdf(printableOrders)}
          >
            <Printer className="h-4 w-4" /> PDF Label Paket SMD
          </Button>
        </div>
      </div>

      {/* Ringkasan KPI Hub Samarinda */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <GlassCard className="p-4">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Total Paket Kloter Samarinda</span>
          <p className="mt-1 text-2xl font-extrabold text-[#24201A]">{samarindaOrders.length} Paket</p>
          <span className="text-[11px] text-[hsl(var(--sage-700))] font-semibold">
            Siap QC &amp; distribusi lokal
          </span>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Stok Ready di Hub Samarinda</span>
          <p className="mt-1 text-2xl font-extrabold text-[#24201A]">
            {stockItems.reduce((s, i) => s + Number(i.stockQty || 0), 0)} Pcs
          </p>
          <span className="text-[11px] text-[#C8524B] font-semibold">
            {stockItems.length} SKU Tayang di Homepage
          </span>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Komisi Order Web Samarinda</span>
          <p className="mt-1 text-2xl font-extrabold text-[hsl(var(--sage-700))]">20%</p>
          <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
            Dari Laba Bersih Jastip Kloter SMD
          </span>
        </GlassCard>
        <GlassCard className="p-4 bg-[#FCF3E4] border-[#E6DAC3]">
          <span className="text-xs font-bold text-[#24201A]">Komisi Referral / POS (BAWASMD)</span>
          <p className="mt-1 text-2xl font-extrabold text-[#C8524B]">30%</p>
          <span className="text-[11px] text-[#24201A] font-medium">
            Setara 30% : 30% : 30% untuk order yang dibawa Partner SMD!
          </span>
        </GlassCard>
      </div>

      {/* Navigasi 4 Tab Hub Samarinda */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-[hsl(var(--border))]">
        {[
          { id: "manifest" as const, label: "1. Manifest Kloter & QC Barang Tiba", icon: PackageCheck },
          { id: "pos" as const, label: "2. Input Order Pelanggan Samarinda (POS)", icon: Plus },
          { id: "stock" as const, label: "3. Kelola Ready Stock Hub Samarinda", icon: ShoppingBag },
          { id: "marketing" as const, label: "4. Kit Promosi WA & IG Samarinda", icon: Megaphone },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0",
              tab === t.id
                ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--surface))] text-[#24201A]"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[#24201A]"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MANIFEST KLOTER & QC BARANG TIBA DI SAMARINDA */}
      {tab === "manifest" && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#24201A]">
                Manifest Kloter &amp; Checklist Penerimaan Paket di Samarinda
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Centang paket yang sudah tiba di Hub Samarinda, lalu klik tombol WhatsApp untuk mengabari pelanggan agar mengambil di Pickup Point atau dikirim kurir lokal.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadExcelCsv(
                  "Manifest_Kloter_Hub_Samarinda.csv",
                  ["Kode Order", "Pelanggan", "No WA", "Kota", "Metode", "Daftar Barang", "Berat (Kg)", "Voucher"],
                  samarindaOrders.map((o) => [
                    o.code,
                    o.customerName,
                    o.customerPhone,
                    o.address?.city ?? "Samarinda",
                    o.deliveryMethod,
                    o.items.map((i) => `${i.qty}x ${i.name}`).join("; "),
                    o.estimatedKg,
                    o.voucherCode ?? "-",
                  ])
                )
              }
            >
              <Download className="h-4 w-4" /> Export Excel/CSV Manifest SMD
            </Button>
          </div>

          {samarindaOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Belum ada pesanan kloter Samarinda yang masuk. Gunakan tab <strong>2. Input Order Pelanggan Samarinda (POS)</strong> untuk mencatat pesanan pelanggan Samarinda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-[11px] uppercase text-[hsl(var(--muted-foreground))]">
                    <th className="py-3 px-2">QC Tiba</th>
                    <th className="py-3 px-2">Kode</th>
                    <th className="py-3 px-2">Pelanggan Samarinda</th>
                    <th className="py-3 px-2">Barang Titipan Bandung</th>
                    <th className="py-3 px-2">Distribusi Lokal</th>
                    <th className="py-3 px-2">Skema Komisi</th>
                    <th className="py-3 px-2 text-right">Aksi WA &amp; Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {samarindaOrders.map((o) => {
                    const checked = !!qcChecked[o.id];
                    const isReferral =
                      (o.voucherCode ?? "").toUpperCase() === "BAWASMD" ||
                      (o.customerNotes ?? "").includes("BAWASMD");
                    const waText = `Halo Kak ${o.customerName}! Paket Bawabawa.id (#${o.code}) dari Bandung sudah mendarat dengan aman di *Hub Bawabawa Samarinda* 🎉\n\nSilakan konfirmasi apakah mau diambil di Pickup Point Hub Samarinda atau diantar kurir lokal hari ini ya Kak. Terima kasih!`;
                    const waHref = `https://wa.me/${o.customerPhone.replace(/\D/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(waText)}`;

                    return (
                      <tr key={o.id} className={cn(checked && "bg-[hsl(var(--sage-50))]")}>
                        <td className="py-3 px-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setQcChecked((prev) => ({ ...prev, [o.id]: e.target.checked }))
                            }
                            className="h-4 w-4 accent-[hsl(var(--sage-700))]"
                          />
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-[#24201A]">{o.code}</td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-[#24201A]">{o.customerName}</div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">{o.customerPhone}</div>
                        </td>
                        <td className="py-3 px-2">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="text-xs">
                              <strong>{it.qty}x</strong> {it.name} {it.variant ? `(${it.variant})` : ""}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-2 text-xs">
                          <Badge variant="neutral">
                            {o.deliveryMethod === "pickup" ? "📍 Pickup Hub SMD" : `🛵 Kurir: ${o.address?.city ?? "Samarinda"}`}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          {isReferral ? (
                            <span className="rounded-full bg-[#F5DFAD] px-2.5 py-0.5 text-[11px] font-bold text-[#24201A]">
                              🌟 Referral BAWASMD (30%)
                            </span>
                          ) : (
                            <span className="rounded-full bg-[hsl(var(--bg))] border border-[hsl(var(--border))] px-2.5 py-0.5 text-[11px] font-semibold">
                              Reguler Hub (20%)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right space-x-1.5">
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-[hsl(var(--sage-700))] px-2.5 py-1.5 text-xs font-bold text-white"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Kabari WA
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      {/* TAB 2: INPUT ORDER PELANGGAN SAMARINDA (POS SAMARINDA) */}
      {tab === "pos" && (
        <GlassCard className="p-5 sm:p-6 max-w-3xl space-y-4">
          <div>
            <span className="rounded-full bg-[#F5DFAD] px-2.5 py-0.5 text-[11px] font-bold text-[#24201A]">
              Otomatis Kode BAWASMD · Komisi Partner Samarinda 30%
            </span>
            <h2 className="mt-2 text-lg font-bold text-[#24201A]">
              Input Cepat Pesanan Pelanggan Samarinda (Walk-in / Chat WA Teman Samarinda)
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Gunakan form ini saat ada teman/pelanggan di Samarinda yang menitip langsung lewat WA Partner Samarinda. Pesanan langsung masuk ke daftar belanja Bandung dan otomatis dihitung ke komisi 30% Partner Samarinda.
            </p>
          </div>

          <form onSubmit={handleCreatePosOrder} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Nama Pelanggan Samarinda *</Label>
                <Input
                  required
                  value={posCustomerName}
                  onChange={(e) => setPosCustomerName(e.target.value)}
                  placeholder="Contoh: Kak Nabila Samarinda"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nomor WhatsApp Pelanggan *</Label>
                <Input
                  required
                  value={posCustomerPhone}
                  onChange={(e) => setPosCustomerPhone(e.target.value)}
                  placeholder="081255667788"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Pilih Produk Viral Bandung (atau Ketik Manual)</Label>
                <select
                  value={posProduct}
                  onChange={(e) => {
                    const selected = VIRAL_BANDUNG_CATALOG.find((p) => p.name === e.target.value);
                    setPosProduct(e.target.value);
                    if (selected) {
                      setPosStore(selected.originStore);
                      setPosPrice(selected.price);
                    }
                  }}
                  className="mt-1 h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--bg))] px-3 text-sm"
                >
                  {VIRAL_BANDUNG_CATALOG.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} — {formatIDR(p.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Toko Asal di Bandung</Label>
                <Input
                  value={posStore}
                  onChange={(e) => setPosStore(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label>Jumlah (Qty)</Label>
                <Input
                  type="number"
                  min={1}
                  value={posQty}
                  onChange={(e) => setPosQty(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Harga Satuan Toko (Rp)</Label>
                <Input
                  type="number"
                  value={posPrice}
                  onChange={(e) => setPosPrice(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label>Metode Ambil di Samarinda</Label>
                <select
                  value={posCity}
                  onChange={(e) => setPosCity(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--bg))] px-3 text-xs font-semibold"
                >
                  <option value="Samarinda Kota (Pickup di Hub Samarinda)">Pickup di Hub Samarinda</option>
                  <option value="Samarinda (Diantar Kurir Lokal)">Diantar Kurir Lokal Samarinda</option>
                  <option value="Tenggarong">Tenggarong</option>
                  <option value="Balikpapan">Balikpapan</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Alamat / Catatan Pengambilan di Samarinda</Label>
              <Input
                value={posAddress}
                onChange={(e) => setPosAddress(e.target.value)}
                className="mt-1"
              />
            </div>

            {posSuccess && (
              <div className="rounded-xl bg-[hsl(var(--sage-100))] border border-[hsl(var(--sage-700))] p-3 text-xs font-bold text-[hsl(var(--sage-800))]">
                {posSuccess}
              </div>
            )}

            <Button type="submit" disabled={posBusy}>
              <Plus className="h-4 w-4" />
              {posBusy ? "Menyimpan..." : "Simpan Order Samarinda (Kode BAWASMD)"}
            </Button>
          </form>
        </GlassCard>
      )}

      {/* TAB 3: KELOLA READY STOCK DI HUB SAMARINDA */}
      {tab === "stock" && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#24201A]">
                Kelola Ready Stock di Hub Bawabawa Samarinda
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Barang yang ada di daftar ini akan tampil di bagian <strong>&ldquo;Ready Stock di Hub Bawabawa Samarinda — Bisa Ambil Hari Ini Tanpa PO!&rdquo;</strong> pada halaman utama website.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setStockItems((prev) => [
                    ...prev,
                    {
                      id: `hub-${Date.now()}`,
                      productName: "Produk Hits Bandung Baru",
                      originStore: "Toko Bandung",
                      variant: "Original",
                      priceSamarindaRp: 65000,
                      stockQty: 5,
                      unit: "box",
                      batchArrivalDate: "Baru Mendarat",
                      status: "ready",
                    },
                  ])
                }
              >
                <Plus className="h-4 w-4" /> Tambah Item Ready Stock
              </Button>
              <Button type="button" size="sm" onClick={handleSaveStock} disabled={savingStock}>
                <Save className="h-4 w-4" /> {savingStock ? "Menyimpan..." : "Simpan & Tayangkan di Web"}
              </Button>
            </div>
          </div>

          {stockSavedMsg && (
            <div className="rounded-xl bg-[hsl(var(--sage-100))] p-3 text-xs font-bold text-[hsl(var(--sage-800))]">
              <CheckCircle2 className="inline h-4 w-4 mr-1" /> {stockSavedMsg}
            </div>
          )}

          <div className="space-y-3">
            {stockItems.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
              >
                <div className="sm:col-span-4">
                  <Label>Nama Produk Ready di Samarinda</Label>
                  <Input
                    value={item.productName}
                    onChange={(e) =>
                      setStockItems((prev) =>
                        prev.map((s, i) => (i === idx ? { ...s, productName: e.target.value } : s))
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-3">
                  <Label>Varian &amp; Toko Asal</Label>
                  <Input
                    value={item.variant}
                    onChange={(e) =>
                      setStockItems((prev) =>
                        prev.map((s, i) => (i === idx ? { ...s, variant: e.target.value } : s))
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Harga Ready SMD (Rp)</Label>
                  <Input
                    type="number"
                    value={item.priceSamarindaRp}
                    onChange={(e) =>
                      setStockItems((prev) =>
                        prev.map((s, i) =>
                          i === idx ? { ...s, priceSamarindaRp: Number(e.target.value) || 0 } : s
                        )
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Sisa Stok ({item.unit})</Label>
                  <Input
                    type="number"
                    value={item.stockQty}
                    onChange={(e) =>
                      setStockItems((prev) =>
                        prev.map((s, i) =>
                          i === idx ? { ...s, stockQty: Math.max(0, Number(e.target.value) || 0) } : s
                        )
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStockItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="h-10 w-10 rounded-xl border border-[hsl(var(--border))] grid place-items-center text-[#C8524B] hover:bg-[#FBE8E6]"
                    aria-label="Hapus item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* TAB 4: KIT PROMOSI WA & IG STORY SAMARINDA */}
      {tab === "marketing" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketingTemplates.map((tpl, idx) => (
            <GlassCard key={tpl.title} className="p-5 flex flex-col justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--sage-700))]">
                  <Sparkles className="h-3.5 w-3.5" /> Siap Copy-Paste ke WA / IG Story
                </span>
                <h3 className="mt-1 text-sm font-bold text-[#24201A]">{tpl.title}</h3>
                <Textarea
                  readOnly
                  value={tpl.text}
                  className="mt-3 min-h-[210px] text-xs font-mono bg-[hsl(var(--bg))]"
                />
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  void navigator.clipboard?.writeText(tpl.text);
                  setCopiedIdx(idx);
                  setTimeout(() => setCopiedIdx(null), 1500);
                }}
              >
                {copiedIdx === idx ? (
                  <>
                    <Check className="h-4 w-4" /> Berhasil Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Salin Teks Promosi
                  </>
                )}
              </Button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
