"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingBag,
  PackageCheck,
  CreditCard,
  Sparkles,
  CircleCheck,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  Truck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatIDR } from "@/lib/utils";

// Real trip schedule rows that match the admin-curated /admin/trips CRUD.
// We fetch live from /api/v1/trips (public, only published+non-closed).
type TripRow = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveEstimateAt: string | null;
  capacityKg: number;
  bookedKg: number;
  baseFee: number;
  perKgFee: number;
  status: string;
  popularCategories: string[] | null;
  isPublished: boolean;
};
import { cn } from "@/lib/utils";
import {
  TIERS,
  type TierId,
  type PricingBreakdown,
  estimateItemWeightKg,
  computePricing,
} from "@/lib/pricing";
import {
  saveLocalOrder,
  generateTrackingToken,
  type LocalOrder,
} from "@/lib/local-orders";

const CATEGORIES = ["Fashion", "Skincare", "Snack Bandung", "Sepatu", "Tas", "Hijab", "Elektronik", "Aksesoris", "Lainnya"];

type Item = {
  id: string;
  name: string;
  link: string;
  category: string;
  qty: number;
  estPrice: number;
  weightKgOverride?: number;
  notes: string;
  imageDataUrl?: string;
};

const STEPS = [
  { id: 1, label: "Detail Barang", icon: ShoppingBag },
  { id: 2, label: "Layanan & Trip", icon: Truck },
  { id: 3, label: "Alamat", icon: PackageCheck },
  { id: 4, label: "Pembayaran", icon: CreditCard },
];

export function RequestFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), name: "", link: "", category: "Fashion", qty: 1, estPrice: 0, notes: "" },
  ]);
  const [tier, setTier] = useState<TierId>("batch");
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [tripId, setTripId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/trips", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { success?: boolean; data?: TripRow[] };
        if (cancelled) return;
        const rows = Array.isArray(json.data) ? json.data : [];
        setTrips(rows);
        if (rows.length > 0 && tripId === null) setTripId(rows[0].id);
      } catch {
        // Open Trip is optional — if API is unreachable we leave the
        // schedule empty; customers still see the Reguler tier and a clear
        // empty-state for Kargo ("belum ada trip dijadwalkan").
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "Samarinda",
    postal: "",
    label: "Rumah",
    notes: "",
  });
  const [payment, setPayment] = useState<"qris" | "transfer" | "ewallet">("qris");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

  const trip = tier === "batch" ? trips.find((t) => t.id === tripId) ?? null : null;
  const itemsTotal = items.reduce((s, i) => s + (i.estPrice || 0) * (i.qty || 1), 0);
  const totalKg = items.reduce(
    (s, i) => s + (i.weightKgOverride ?? estimateItemWeightKg(i.category, i.qty)),
    0,
  );
  const pricing: PricingBreakdown = computePricing({
    itemsTotal,
    totalKg,
    tier,
  });

  const canNext = useMemo(() => {
    if (step === 1) return items.every((i) => i.name.trim().length > 0 && i.qty >= 1);
    // Kargo butuh pilih trip; Reguler boleh skip (langsung pakai
    // ekspedisi reguler JNE/SiCepat, tidak nunggu jadwal Open Trip).
    if (step === 2 && tier === "batch") return trips.length === 0 ? false : tripId !== null;
    if (step === 3) return address.name && address.phone && address.street && address.city && address.postal;
    return true;
  }, [step, tier, items, trips.length, tripId, address]);

  const handleSubmit = () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    const token = generateTrackingToken();
    const order: LocalOrder = {
      token,
      code: "BWB-" + token.slice(0, 6).toUpperCase(),
      createdAt: new Date().toISOString(),
      tier,
      tripCode: trip?.code,
      tripDepartAt: trip?.departAt,
      tripArriveEstimateAt: trip?.arriveEstimateAt ?? undefined,
      items: items.map((i) => ({
        name: i.name,
        category: i.category,
        qty: i.qty,
        estPrice: i.estPrice,
        notes: i.notes,
      })),
      address,
      payment,
      pricing,
      totalKg,
      status: "pending_payment",
    };
    saveLocalOrder(order);
    setTrackingToken(token);
    setSubmitted(true);
    setSubmitting(false);
    router.prefetch(`/track/${token}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8">
        <Stepper step={step} />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -16, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-6"
          >
            {step === 1 && (
              <ItemsStep items={items} setItems={setItems} />
            )}
            {step === 2 && (
              <TripStep
                tier={tier}
                setTier={setTier}
                trips={trips}
                tripId={tripId}
                setTripId={setTripId}
              />
            )}
            {step === 3 && (
              <AddressStep address={address} setAddress={setAddress} />
            )}
            {step === 4 && (
              <PaymentStep
                payment={payment}
                setPayment={setPayment}
                submitted={submitted}
                submitting={submitting}
                trackingToken={trackingToken}
                onSubmit={handleSubmit}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {!submitted && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
            {step < STEPS.length ? (
              <Button
                variant="primary"
                onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                disabled={!canNext}
              >
                Lanjut <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="accent" onClick={handleSubmit} disabled={submitting}>
                Konfirmasi & Bayar <Sparkles className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <aside className="lg:col-span-4">
        <SummaryCard
          items={items}
          pricing={pricing}
          trip={trip}
          tier={tier}
        />
      </aside>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4 text-sm">
      {STEPS.map((s, idx) => {
        const done = step > s.id;
        const active = step === s.id;
        return (
          <li key={s.id} className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div
              className={cn(
                "h-8 w-8 rounded-full grid place-items-center transition-all shrink-0",
                done && "bg-[hsl(var(--emerald-500))] text-white",
                active && "bg-[hsl(var(--sage-700))] text-[hsl(var(--primary-foreground))] shadow-[0_4px_16px_-6px_hsl(var(--sage-700)/0.6)]",
                !done && !active && "bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
              )}
            >
              {done ? <CircleCheck className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            </div>
            <span
              className={cn(
                "hidden sm:inline truncate",
                active ? "text-[hsl(var(--foreground))] font-medium" : "text-[hsl(var(--muted-foreground))]"
              )}
            >
              {s.label}
            </span>
            {idx < STEPS.length - 1 && (
              <div className="hidden sm:block h-px w-8 bg-[hsl(var(--border))]" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ItemsStep({ items, setItems }: { items: Item[]; setItems: (v: Item[]) => void }) {
  const update = (id: string, patch: Partial<Item>) =>
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: string) => setItems(items.length > 1 ? items.filter((i) => i.id !== id) : items);
  const add = () =>
    setItems([
      ...items,
      { id: crypto.randomUUID(), name: "", link: "", category: "Fashion", qty: 1, estPrice: 0, notes: "" },
    ]);

  return (
    <GlassCard className="p-6">
      <div className="flex flex-col gap-5">
        {items.map((it, idx) => (
          <div key={it.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Barang #{idx + 1}</p>
              {items.length > 1 && (
                <button
                  onClick={() => remove(it.id)}
                  className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--danger))] inline-flex items-center gap-1.5 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 grid gap-1.5">
                <Label>Nama barang</Label>
                <Input
                  value={it.name}
                  onChange={(e) => update(it.id, { name: e.target.value })}
                  placeholder="Sepatu Compass Gazelle Hi"
                />
              </div>
              <div className="sm:col-span-2 grid gap-1.5">
                <Label>Link produk (Shopee/Tokopedia/lainnya)</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    value={it.link}
                    onChange={(e) => update(it.id, { link: e.target.value })}
                    placeholder="https://shopee.co.id/..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Kategori</Label>
                <select
                  value={it.category}
                  onChange={(e) => update(it.id, { category: e.target.value })}
                  className="h-11 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--surface))] px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Jumlah</Label>
                <Input
                  type="number"
                  min={1}
                  value={it.qty}
                  onChange={(e) => update(it.id, { qty: Math.max(1, Number(e.target.value)) })}
                />
              </div>
              <div className="sm:col-span-2 grid gap-1.5">
                <Label>Estimasi harga / pcs (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  value={it.estPrice}
                  onChange={(e) => update(it.id, { estPrice: Math.max(0, Number(e.target.value)) })}
                  placeholder="500000"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Sistem akan mencari harga aktual saat shopper belanja & meminta approval kalau ada perbedaan.
                </p>
              </div>
              <div className="sm:col-span-2 grid gap-1.5">
                <Label>
                  Estimasi berat (kg) <span className="text-[hsl(var(--muted-foreground))] font-normal">— opsional</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={it.weightKgOverride ?? ""}
                  onChange={(e) =>
                    update(it.id, {
                      weightKgOverride: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
                    })
                  }
                  placeholder={`Auto: ${estimateItemWeightKg(it.category, it.qty).toFixed(1)} kg`}
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Kosongkan untuk pakai estimasi otomatis berdasar kategori ({it.category}). Berat menentukan tarif kargo.
                </p>
              </div>
              <div className="sm:col-span-2 grid gap-1.5">
                <Label>Catatan tambahan</Label>
                <Textarea
                  value={it.notes}
                  onChange={(e) => update(it.id, { notes: e.target.value })}
                  placeholder="Warna hitam ukuran 39, kalau habis tolong di-update."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-5 py-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[hsl(var(--sage-400))] transition-colors">
                  <Upload className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  <p className="text-sm font-medium">Upload foto barang (opsional)</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">JPG/PNG/WebP, max 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => update(it.id, { imageDataUrl: reader.result as string });
                      reader.readAsDataURL(file);
                    }}
                  />
                  {it.imageDataUrl && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-[hsl(var(--emerald-600))]">
                      <ImageIcon className="h-4 w-4" /> Foto terupload
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={add}>
          <Plus className="h-4 w-4" /> Tambah barang
        </Button>
      </div>
    </GlassCard>
  );
}

function TripStep({
  tier,
  setTier,
  trips,
  tripId,
  setTripId,
}: {
  tier: TierId;
  setTier: (v: TierId) => void;
  trips: TripRow[];
  tripId: string | null;
  setTripId: (v: string) => void;
}) {
  // Reguler tier doesn't need a trip pick — it ships via reguler ekspedisi
  // (JNE/SiCepat reguler) directly, with its own 3–4-day ETA. Open Trip
  // selector below only renders when the user picks Kargo.
  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <h3 className="text-base font-semibold">Pilih tipe layanan</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Reguler lebih cepat tapi lebih mahal, Kargo lebih hemat tapi nunggu
          jadwal Open Trip berikutnya.
        </p>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.values(TIERS)).map((t) => {
            const active = tier === t.id;
            const Icon = t.id === "fast" ? Zap : Truck;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTier(t.id)}
                className={cn(
                  "text-left rounded-2xl border p-5 transition-all",
                  active
                    ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.25)] ring-2 ring-[hsl(var(--sage-700))]/30"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="font-semibold">{t.label}</p>
                  {active && <Badge variant="success" className="ml-auto">Dipilih</Badge>}
                </div>
                <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">{t.tagline}</p>
                <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">ETA {t.eta}</p>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {tier === "fast" ? (
        <GlassCard className="p-6">
          <div className="flex items-start gap-3">
            <span className="h-10 w-10 rounded-xl bg-[hsl(var(--emerald-500)/0.15)] grid place-items-center text-[hsl(var(--emerald-600))] dark:text-[hsl(var(--emerald-400))]">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold">Reguler tidak butuh Open Trip</h3>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Pengiriman pakai ekspedisi reguler (JNE / SiCepat reguler) langsung dari
                shopper. Estimasi 3–4 hari kerja tiba di Samarinda, tanpa nunggu jadwal
                trip mingguan. Resi akan kamu terima begitu shopper selesai packing.
              </p>
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">Pilih jadwal Open Trip (Kargo)</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Kargo dijalankan per batch — estimasi 10 hari kerja, tarif flat 200rb / 50 kg.
            Pilih trip yang sudah dipublish admin.
          </p>
          {trips.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 text-sm text-[hsl(var(--muted-foreground))]">
              Belum ada jadwal Open Trip yang dipublish. Coba lagi nanti atau pilih tipe layanan <strong>Reguler</strong>.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {trips.filter((t) => t.status !== "in_transit" && t.status !== "closed").map((t) => {
                const filled = t.capacityKg > 0 ? Math.round((t.bookedKg / t.capacityKg) * 100) : 0;
                const isFull = t.status === "fullbooked" || filled >= 100;
                const active = tripId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => !isFull && setTripId(t.id)}
                    className={cn(
                      "text-left rounded-2xl border p-4 transition-all",
                      active
                        ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.25)] ring-2 ring-[hsl(var(--sage-700))]/30"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]",
                      isFull && "opacity-60 cursor-not-allowed",
                    )}
                    disabled={isFull}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{t.code}</p>
                      {isFull ? <Badge variant="warning">Fullbooked</Badge> : <Badge variant="success">Tersedia</Badge>}
                    </div>
                    <p className="mt-1.5 font-semibold">
                      {formatDate(t.departAt, { weekday: "long", day: "numeric", month: "short" })}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {t.arriveEstimateAt
                        ? `Estimasi tiba ${formatDate(t.arriveEstimateAt, { day: "numeric", month: "short" })}`
                        : "Estimasi tiba ditentukan saat booking penuh"}
                    </p>
                    <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                      {Math.max(0, t.capacityKg - t.bookedKg)} kg slot tersisa
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

type Address = {
  name: string;
  phone: string;
  street: string;
  city: string;
  postal: string;
  label: string;
  notes: string;
};
function AddressStep({ address, setAddress }: { address: Address; setAddress: (a: Address) => void }) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-base font-semibold">Alamat penerima di Samarinda</h3>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Nama penerima</Label>
          <Input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="Aulia Putri" />
        </div>
        <div className="grid gap-1.5">
          <Label>No. WhatsApp</Label>
          <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="+62 812-3456-7890" />
        </div>
        <div className="sm:col-span-2 grid gap-1.5">
          <Label>Alamat lengkap</Label>
          <Textarea
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            placeholder="Jl. Bukit Pinang Blok C No. 12, RT 03/RW 02"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Kota</Label>
          <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Kode pos</Label>
          <Input value={address.postal} onChange={(e) => setAddress({ ...address, postal: e.target.value })} placeholder="75124" />
        </div>
        <div className="grid gap-1.5">
          <Label>Label</Label>
          <select
            value={address.label}
            onChange={(e) => setAddress({ ...address, label: e.target.value })}
            className="h-11 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--surface))] px-3 text-sm"
          >
            <option>Rumah</option>
            <option>Kantor</option>
            <option>Lainnya</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label>Catatan kurir (opsional)</Label>
          <Input value={address.notes} onChange={(e) => setAddress({ ...address, notes: e.target.value })} placeholder="Pagar hitam, titip ke pos satpam" />
        </div>
      </div>
    </GlassCard>
  );
}

function PaymentStep({
  payment,
  setPayment,
  submitted,
  submitting,
  trackingToken,
  onSubmit,
}: {
  payment: "qris" | "transfer" | "ewallet";
  setPayment: (v: "qris" | "transfer" | "ewallet") => void;
  submitted: boolean;
  submitting: boolean;
  trackingToken: string | null;
  onSubmit: () => void;
}) {
  const methods = [
    { v: "qris" as const, label: "QRIS", desc: "Bayar instan dari semua e-wallet" },
    { v: "transfer" as const, label: "Transfer Bank", desc: "BCA / Mandiri / BNI / BRI" },
    { v: "ewallet" as const, label: "E-Wallet", desc: "OVO / GoPay / Dana / ShopeePay" },
  ];
  if (submitted && trackingToken) {
    return (
      <GlassCard className="p-10 text-center">
        <div className="mx-auto h-16 w-16 rounded-3xl bg-linear-to-br from-[hsl(var(--emerald-400))] to-[hsl(var(--emerald-600))] grid place-items-center text-white">
          <CircleCheck className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-tight">Request kamu sudah masuk!</h3>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
          Simpan link tracking di bawah — tanpa login, kamu tetap bisa pantau
          status pesanan. Tim kami akan kontak via WhatsApp untuk konfirmasi
          pembayaran.
        </p>
        <div className="mt-5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-3 font-mono text-xs break-all">
          /track/{trackingToken}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild variant="primary">
            <a href={`/track/${trackingToken}`}>Buka tracking</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/open-trip">Lihat Open Trip lain</a>
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-base font-semibold">Pilih metode pembayaran</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Pembayaran masuk escrow — dirilis ke shopper setelah barang diterima.
      </p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {methods.map((m) => (
          <button
            key={m.v}
            onClick={() => setPayment(m.v)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-all",
              payment === m.v
                ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.25)] ring-2 ring-[hsl(var(--sage-700))]/30"
                : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
            )}
          >
            <p className="font-semibold">{m.label}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{m.desc}</p>
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="accent" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Memproses…" : <>Konfirmasi & Bayar <Sparkles className="h-4 w-4" /></>}
        </Button>
      </div>
    </GlassCard>
  );
}

function SummaryCard({
  items,
  pricing,
  trip,
  tier,
}: {
  items: Item[];
  pricing: PricingBreakdown;
  trip: TripRow | null;
  tier: TierId;
}) {
  const tierLabel = TIERS[tier].label;
  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      <GlassCard className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
          Estimasi biaya
        </p>
        <div className="mt-5 space-y-3 text-sm">
          {items.map((it, i) => (
            <div key={it.id} className="flex items-start justify-between gap-2">
              <span className="text-[hsl(var(--muted-foreground))] truncate">
                {it.name || `Barang #${i + 1}`} <span className="text-xs">× {it.qty}</span>
              </span>
              <span className="tabular-nums">{formatIDR((it.estPrice || 0) * (it.qty || 1))}</span>
            </div>
          ))}
          <Divider />
          <Row label="Subtotal barang" value={formatIDR(pricing.itemsTotal)} />
          <Row label="Fee jasa titip (8%)" value={formatIDR(pricing.jastipFee)} />
          <Row
            label={`Ongkir ${tierLabel} (${pricing.billingKg.toFixed(1)} kg)`}
            value={formatIDR(pricing.shippingFee)}
          />
          <Row label="PPN 11%" value={formatIDR(pricing.ppn)} />
          <Divider />
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total estimasi</span>
            <span className="text-lg font-semibold tabular-nums">{formatIDR(pricing.total)}</span>
          </div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            * Tanpa pajak impor / bea cukai. Layanan domestik 100%. Harga
            barang akan dikonfirmasi ulang sesuai harga aktual saat shopper
            belanja.
          </p>
        </div>
      </GlassCard>
      <GlassCard className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <p className="font-semibold">Estimasi tiba</p>
            <p className="text-[hsl(var(--muted-foreground))]">
              {tier === "fast"
                ? "3–4 hari kerja setelah shopper packing & resi keluar"
                : trip?.arriveEstimateAt
                  ? formatDate(trip.arriveEstimateAt, { weekday: "long", day: "numeric", month: "short" })
                  : "Tergantung jadwal Open Trip yang kamu pilih"}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
function Divider() {
  return <div className="h-px bg-[hsl(var(--border))]" />;
}
