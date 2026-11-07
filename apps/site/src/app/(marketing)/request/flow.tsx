"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatIDR } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { rememberOrderLink } from "@/lib/local-orders";
import { cart } from "@/lib/cart";
import { errorMessage } from "@/lib/order-requests";
import {
  DEFAULT_PAYMENT_INFO,
  DEFAULT_ZONE_RATES,
  VIRAL_BANDUNG_CATALOG,
  computeZoneEstimate,
  type DeliveryZoneKey,
  type PaymentInfoConfig,
  type ZoneRateConfig,
} from "@/lib/viral-bandung-data";
import { PaymentQrisCard, type InvoiceOrderSummary } from "@/components/marketing/payment-qris-card";

type LineItem = {
  id: string;
  productId?: string;
  name: string;
  store: string;
  variant: string;
  category: string;
  qty: number;
  unitPriceRp: number;
  weightKg: number;
  notes: string;
};

type OutOfStockPref = "substitute" | "ask" | "cancel";

function createEmptyLine(id: string): LineItem {
  return {
    id,
    name: "",
    store: "",
    variant: "",
    category: "Bakery & Pastry Viral",
    qty: 1,
    unitPriceRp: 55000,
    weightKg: 0.5,
    notes: "",
  };
}

export function RequestFlow({
  mode = "request",
  zones = DEFAULT_ZONE_RATES,
  payment = DEFAULT_PAYMENT_INFO,
}: {
  mode?: "request" | "catalog";
  zones?: ZoneRateConfig[];
  payment?: PaymentInfoConfig;
}) {
  const cartLines = useSyncExternalStore(cart.subscribe, cart.get, cart.getServer);

  const [zoneId, setZoneId] = useState<DeliveryZoneKey>("jabar_travel");
  const [selectedCity, setSelectedCity] = useState<string>("Jakarta (Selatan/Pusat/Barat/Timur/Utara)");
  const [selectedShuttle, setSelectedShuttle] = useState<string>("Cititrans (Jakarta, BSD, Depok, Bekasi)");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");

  const [lines, setLines] = useState<LineItem[]>([createEmptyLine("line-initial")]);
  const [outOfStock, setOutOfStock] = useState<OutOfStockPref>("substitute");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [voucherCode, setVoucherCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<{
    token: string | null;
    summary: InvoiceOrderSummary;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const qZone = sp.get("zone") as DeliveryZoneKey | null;
    const qItem = sp.get("item");
    const qStore = sp.get("store");
    const qVoucher = sp.get("voucher");

    if (qZone && ["bandung_instant", "jabar_travel", "samarinda_hub"].includes(qZone)) {
      setZoneId(qZone);
      const foundZone = zones.find((z) => z.id === qZone);
      if (foundZone?.cities[0]) setSelectedCity(foundZone.cities[0]);
      if (foundZone?.shuttles?.[0]) setSelectedShuttle(foundZone.shuttles[0]);
    }
    if (qVoucher) {
      setVoucherCode(qVoucher.toUpperCase());
    }

    const currentCart = cart.get();
    if ((mode === "catalog" || sp.get("from") === "cart") && currentCart.length > 0) {
      setLines(
        currentCart.map((c, idx) => ({
          id: `cart-${idx}-${c.productId}`,
          productId: c.productId,
          name: c.name,
          store: "Katalog Bawabawa Bandung",
          variant: c.variant ?? "",
          category: "Bakery & Pastry Viral",
          qty: c.qty,
          unitPriceRp: c.price,
          weightKg: c.weightKg || 0.5,
          notes: "",
        }))
      );
    } else if (qItem) {
      const matched = VIRAL_BANDUNG_CATALOG.find(
        (p) => p.name.toLowerCase().includes(qItem.toLowerCase()) || qItem.toLowerCase().includes(p.name.toLowerCase())
      );
      setLines([
        {
          id: "line-prefilled",
          productId: matched?.id,
          name: qItem,
          store: qStore || matched?.originStore || "Toko Bandung",
          variant: matched?.variants[0] ?? "",
          category: matched?.category ?? "Bakery & Pastry Viral",
          qty: 1,
          unitPriceRp: matched?.price ?? 65000,
          weightKg: matched?.weightKg ?? 0.5,
          notes: "",
        },
      ]);
    }
  }, [mode, zones]);

  const handleZoneChange = (nextZone: DeliveryZoneKey) => {
    setZoneId(nextZone);
    const z = zones.find((item) => item.id === nextZone) ?? zones[0];
    if (z.cities[0]) setSelectedCity(z.cities[0]);
    if (z.shuttles?.[0]) setSelectedShuttle(z.shuttles[0]);
    if (nextZone === "samarinda_hub") {
      setDeliveryMethod("pickup");
    } else {
      setDeliveryMethod("delivery");
    }
  };

  const addQuickProduct = (prodId: string) => {
    const prod = VIRAL_BANDUNG_CATALOG.find((p) => p.id === prodId);
    if (!prod) return;
    setLines((prev) => {
      if (prev.length === 1 && !prev[0].name.trim()) {
        return [
          {
            id: `prod-${prod.id}-${Date.now()}`,
            productId: prod.id,
            name: prod.name,
            store: prod.originStore,
            variant: prod.variants[0] ?? "",
            category: prod.category,
            qty: 1,
            unitPriceRp: prod.price,
            weightKg: prod.weightKg,
            notes: "",
          },
        ];
      }
      return [
        ...prev,
        {
          id: `prod-${prod.id}-${Date.now()}`,
          productId: prod.id,
          name: prod.name,
          store: prod.originStore,
          variant: prod.variants[0] ?? "",
          category: prod.category,
          qty: 1,
          unitPriceRp: prod.price,
          weightKg: prod.weightKg,
          notes: "",
        },
      ];
    });
  };

  const totalItemRp = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.unitPriceRp) || 0) * (Number(l.qty) || 1), 0),
    [lines]
  );

  const totalWeightKg = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.weightKg) || 0.5) * (Number(l.qty) || 1), 0),
    [lines]
  );

  const estimate = useMemo(
    () =>
      computeZoneEstimate({
        zoneId,
        itemSubtotalRp: totalItemRp,
        weightKg: totalWeightKg,
        voucherCode,
        zones,
      }),
    [zoneId, totalItemRp, totalWeightKg, voucherCode, zones]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);

    const validLines = lines.filter((l) => l.name.trim().length >= 2);
    if (validLines.length === 0) {
      setSubmitError("Mohon isi minimal 1 nama barang / kuliner Bandung yang ingin dititip.");
      return;
    }
    if (customerName.trim().length < 2) {
      setSubmitError("Mohon isi nama lengkap penerima.");
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!/^(62|0)?8\d{7,12}$/.test(cleanPhone)) {
      setSubmitError("Mohon isi nomor WhatsApp aktif (contoh: 08123456789).");
      return;
    }
    if (streetAddress.trim().length < 5) {
      setSubmitError("Mohon isi alamat lengkap pengiriman atau lokasi Pool Travel / Pickup Hub Samarinda.");
      return;
    }

    setSubmitting(true);

    const mappedTier =
      zoneId === "bandung_instant" ? "air" : zoneId === "jabar_travel" ? "regular" : "batch";

    const fullZoneNote = `[JALUR: ${estimate.zone.shortLabel}] [SHUTTLE/POOL: ${selectedShuttle}] ${customerNotes}`.trim();

    const payload = {
      source: "request" as const,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      address: {
        street: streetAddress.trim(),
        city: selectedCity,
        postal: "40111",
        notes: fullZoneNote,
      },
      tier: mappedTier,
      tripId: null,
      voucherCode: voucherCode.trim() ? voucherCode.trim().toUpperCase() : undefined,
      deliveryMethod,
      items: validLines.map((l) => ({
        name: `${l.name.trim()}${l.store.trim() ? ` [${l.store.trim()}]` : ""}`,
        category: "Snack Bandung",
        qty: l.qty,
        maxPrice: Math.max(10000, l.unitPriceRp || 50000),
        variant: l.variant.trim() || undefined,
        notes: l.notes.trim() || undefined,
      })),
      outOfStockPreference: outOfStock,
      customerNotes: fullZoneNote,
      estimatedKg: Number(Math.max(0.5, totalWeightKg).toFixed(2)),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as
        | { data?: { code: string; trackingToken: string; status: string } }
        | null;

      const generatedCode =
        json?.data?.code ?? `BB-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const trackingToken = json?.data?.trackingToken ?? null;

      if (trackingToken) {
        rememberOrderLink({
          token: trackingToken,
          code: generatedCode,
          createdAt: new Date().toISOString(),
          itemCount: validLines.length,
          estimateTotal: estimate.totalRp,
        });
      }

      if (cartLines.length > 0) {
        cart.clear();
      }
      track("request_submit", { zoneId, items: validLines.length });

      setSubmittedOrder({
        token: trackingToken,
        summary: {
          code: generatedCode,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          city: `${selectedCity} (${estimate.zone.shortLabel})`,
          zoneLabel: estimate.zone.label,
          items: validLines.map((l) => ({
            name: l.name,
            variant: [l.store, l.variant].filter(Boolean).join(" · "),
            qty: l.qty,
            unitPrice: l.unitPriceRp,
          })),
          itemsTotal: estimate.itemSubtotalRp,
          jastipFee: estimate.jastipFeeRp,
          shippingFee: estimate.shippingRp,
          discount: estimate.discountRp,
          total: estimate.totalRp,
        },
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(errorMessage(err, "Terjadi kendala jaringan, silakan coba lagi."));
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedOrder) {
    return (
      <div className="space-y-6 animate-rise">
        <GlassCard className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[hsl(var(--sage-700))] text-white">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--sage-700))]">
                  Pesanan Tercatat
                </span>
                <h2 className="text-xl sm:text-2xl font-bold">
                  Kode Pesanan: <span className="font-mono">{submittedOrder.summary.code}</span>
                </h2>
              </div>
            </div>
            {submittedOrder.token && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/track/${submittedOrder.token}`}>
                  Buka Halaman Lacak →
                </Link>
              </Button>
            )}
          </div>

          <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            Pesananmu sudah masuk ke daftar belanja Bandung. Lanjutkan pembayaran via <strong>Transfer Bank (BCA / Mandiri / SeaBank)</strong> atau <strong>QRIS</strong> di bawah, lalu kirim bukti ke WhatsApp Admin.
          </p>
        </GlassCard>

        <PaymentQrisCard order={submittedOrder.summary} payment={payment} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">
        {/* BAGIAN 1: PILIH JALUR PENGIRIMAN */}
        <GlassCard className="p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] font-semibold">
            Langkah 1
          </p>
          <h2 className="mt-1 text-lg font-semibold">Jalur Pengiriman dari Bandung</h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {zones.map((z) => {
              const active = zoneId === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => handleZoneChange(z.id)}
                  className={cn(
                    "rounded-xl border p-3.5 text-left transition-colors",
                    active
                      ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-50))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-2))]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{z.shortLabel}</span>
                    <span className="text-[11px] font-medium text-[hsl(var(--sage-700))]">{z.eta}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    Ongkir mulai {formatIDR(z.baseShippingRp)} · Jastip {Math.round(z.jastipFeeRate * 100)}%
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="select-city">Kota / Wilayah Tujuan</Label>
              <select
                id="select-city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--bg))] px-3 text-sm"
              >
                {estimate.zone.cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {estimate.zone.shuttles && estimate.zone.shuttles.length > 0 && (
              <div>
                <Label htmlFor="select-shuttle">Kurir / Shuttle Travel / Pickup Hub</Label>
                <select
                  id="select-shuttle"
                  value={selectedShuttle}
                  onChange={(e) => setSelectedShuttle(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--bg))] px-3 text-sm"
                >
                  {estimate.zone.shuttles.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </GlassCard>

        {/* BAGIAN 2: DAFTAR BARANG & TOKO BANDUNG */}
        <GlassCard className="p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] font-semibold">
                Langkah 2
              </p>
              <h2 className="mt-1 text-lg font-semibold">Daftar Barang Titipan</h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[hsl(var(--muted-foreground))]">
              <span>Tambah cepat:</span>
              {VIRAL_BANDUNG_CATALOG.slice(0, 5).map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => addQuickProduct(prod.id)}
                  className="underline underline-offset-4 hover:text-[hsl(var(--foreground))]"
                >
                  + {prod.name.split("—")[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg)/0.6)] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                    Barang #{index + 1}
                  </span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((item) => item.id !== line.id))}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--danger))] hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Nama Barang / Makanan *</Label>
                    <Input
                      required
                      value={line.name}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((it) => (it.id === line.id ? { ...it, name: e.target.value } : it))
                        )
                      }
                      placeholder="Contoh: Roti Macan Cranberry Cheese / Bolu Tjilaki 9"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Nama Toko di Bandung</Label>
                    <Input
                      value={line.store}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((it) => (it.id === line.id ? { ...it, store: e.target.value } : it))
                        )
                      }
                      placeholder="Contoh: Roti Macan Buah Batu / Pasar Cihapit"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-2">
                    <Label>Varian / Catatan</Label>
                    <Input
                      value={line.variant}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((it) => (it.id === line.id ? { ...it, variant: e.target.value } : it))
                        )
                      }
                      placeholder="Contoh: Cranberry Cheese / Cadangan Double Choco"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Jumlah</Label>
                    <div className="mt-1 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setLines((prev) =>
                            prev.map((it) =>
                              it.id === line.id ? { ...it, qty: Math.max(1, it.qty - 1) } : it
                            )
                          )
                        }
                        className="h-11 w-9 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] grid place-items-center"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={line.qty}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((it) =>
                              it.id === line.id ? { ...it, qty: Math.max(1, Number(e.target.value) || 1) } : it
                            )
                          )
                        }
                        className="h-11 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--surface))] text-center text-sm font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setLines((prev) =>
                            prev.map((it) =>
                              it.id === line.id ? { ...it, qty: Math.min(99, it.qty + 1) } : it
                            )
                          )
                        }
                        className="h-11 w-9 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] grid place-items-center"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>Harga Satuan (Rp)</Label>
                    <Input
                      inputMode="numeric"
                      value={line.unitPriceRp ? line.unitPriceRp.toLocaleString("id-ID") : ""}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((it) =>
                            it.id === line.id
                              ? { ...it, unitPriceRp: Number(e.target.value.replace(/\D/g, "")) || 0 }
                              : it
                          )
                        )
                      }
                      className="mt-1 tabular-nums"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLines((prev) => [...prev, createEmptyLine(`line-${Date.now()}`)])}
            >
              <Plus className="h-4 w-4" /> Tambah Barang Lain
            </Button>
          </div>

          <div className="mt-5 pt-4 border-t border-[hsl(var(--border))]">
            <Label>Jika varian sedang habis di toko Bandung:</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: "substitute" as const,
                  title: "Ganti Varian Terfavorit",
                  desc: "Agar tetap ikut pengiriman hari ini",
                },
                {
                  id: "ask" as const,
                  title: "Konfirmasi via WhatsApp",
                  desc: "Shopper chat kamu dari toko",
                },
                {
                  id: "cancel" as const,
                  title: "Batalkan & Refund 100%",
                  desc: "Uang kembali utuh tanpa potongan",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOutOfStock(opt.id)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    outOfStock === opt.id
                      ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-50))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
                  )}
                >
                  <p className="text-xs font-semibold">{opt.title}</p>
                  <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* BAGIAN 3: DATA PEMESAN & ALAMAT */}
        <GlassCard className="p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] font-semibold">
            Langkah 3
          </p>
          <h2 className="mt-1 text-lg font-semibold">Kontak &amp; Alamat Penerima</h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cust-name">Nama Penerima *</Label>
              <Input
                id="cust-name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama lengkap kamu"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cust-phone">Nomor WhatsApp *</Label>
              <Input
                id="cust-phone"
                required
                inputMode="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="081234567890"
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="cust-address">
              {zoneId === "samarinda_hub"
                ? "Alamat di Samarinda/Kaltim (Atau tulis: Ambil di Hub Samarinda) *"
                : zoneId === "jabar_travel"
                ? "Alamat Rumah atau Pool Shuttle Travel Tujuan *"
                : "Alamat Lengkap di Bandung Raya (Rumah / Hotel / Stasiun) *"}
            </Label>
            <Textarea
              id="cust-address"
              required
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder={
                zoneId === "samarinda_hub"
                  ? "Contoh: Ambil di Hub Bawabawa Samarinda / Jl. Ir. H. Juanda No. 12 Samarinda"
                  : zoneId === "jabar_travel"
                  ? "Contoh: Ambil di Pool Cititrans Tebet / Antar ke Jl. Kemang Raya No. 8 Jakarta Selatan"
                  : "Contoh: Hotel Savoy Homann Kamar 302 Jl. Asia Afrika Bandung"
              }
              className="mt-1 min-h-[84px]"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cust-voucher">Kode Voucher (Opsional)</Label>
              <Input
                id="cust-voucher"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="BAWASMD / KANGENBDG"
                className="mt-1 uppercase font-mono"
              />
            </div>
            <div>
              <Label htmlFor="cust-notes">Catatan Tambahan</Label>
              <Input
                id="cust-notes"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Opsional"
                className="mt-1"
              />
            </div>
          </div>

          {submitError && (
            <div role="alert" className="mt-4 rounded-xl border border-[hsl(var(--danger)/0.4)] bg-[hsl(var(--danger)/0.08)] p-3 text-xs font-medium text-[hsl(var(--danger))]">
              {submitError}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Kolom Kanan: Ringkasan Estimasi */}
      <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
        <GlassCard className="p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] font-semibold">
            {estimate.zone.shortLabel}
          </p>
          <h3 className="mt-1 text-lg font-semibold">Ringkasan Estimasi</h3>
          <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
            Tujuan: {selectedCity}
          </p>

          <ul className="mt-4 space-y-2 border-t border-[hsl(var(--border))] pt-3 text-xs">
            {lines.map((l, i) => (
              <li key={l.id} className="flex items-start justify-between gap-2">
                <span className="font-medium">
                  {i + 1}. {l.name || "Barang belum diisi"}{" "}
                  <span className="text-[hsl(var(--muted-foreground))]">× {l.qty}</span>
                </span>
                <span className="font-semibold tabular-nums shrink-0">
                  {formatIDR((l.unitPriceRp || 0) * l.qty)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-[hsl(var(--border))] pt-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">Subtotal harga toko</dt>
              <dd className="font-semibold tabular-nums">{formatIDR(estimate.itemSubtotalRp)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">
                Jasa titip ({Math.round(estimate.zone.jastipFeeRate * 100)}%)
              </dt>
              <dd className="font-semibold tabular-nums">{formatIDR(estimate.jastipFeeRp)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">
                Ongkir ({estimate.billableKg} kg)
              </dt>
              <dd className="font-semibold tabular-nums">{formatIDR(estimate.shippingRp)}</dd>
            </div>
            {estimate.discountRp > 0 && (
              <div className="flex justify-between text-[hsl(var(--sage-700))] font-semibold">
                <dt>Potongan ({voucherCode})</dt>
                <dd className="tabular-nums">-{formatIDR(estimate.discountRp)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-[hsl(var(--border))] pt-2.5">
              <dt className="text-sm font-semibold">Total Estimasi</dt>
              <dd className="text-xl font-bold tabular-nums text-[hsl(var(--sage-700))]">
                {formatIDR(estimate.totalRp)}
              </dd>
            </div>
          </dl>

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
              </>
            ) : (
              <>
                Buat Pesanan &amp; Lihat Rekening <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <p className="mt-3 text-[11px] text-center text-[hsl(var(--muted-foreground))] leading-relaxed">
            Nomor rekening BCA/Mandiri, QRIS, Nota PDF, dan tombol konfirmasi WhatsApp akan tampil setelah langkah ini.
          </p>
        </GlassCard>
      </div>
    </form>
  );
}
