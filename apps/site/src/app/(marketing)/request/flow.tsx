"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingBag,
  Truck,
  MapPin,
  ClipboardCheck,
  CircleCheck,
  Link as LinkIcon,
  Zap,
  MessageCircle,
  Loader2,
  Camera,
  Minus,
} from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, formatIDR } from "@/lib/utils";
import {
  TIERS,
  PPN_ENABLED,
  type TierId,
  type PricingBreakdown,
  estimateItemWeightKg,
  computePricing,
  recommendTier,
  shippingFeeFor,
  availableTiers,
  KILAT,
  KILAT_BLOCKED_CATEGORIES,
} from "@/lib/pricing";
import { track } from "@/lib/analytics";
import { rememberOrderLink } from "@/lib/local-orders";
import { cart, type CartLine } from "@/lib/cart";
import { waLink } from "@/lib/contact";
import { OUT_OF_STOCK_LABEL, errorMessage } from "@/lib/order-requests";

// Live schedule from /api/v1/trips (published + not closed).
type TripRow = {
  id: string;
  code: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveEstimateAt: string | null;
  capacityKg: number;
  bookedKg: number;
  status: string;
  poClosesAt?: string | null;
};

const PICKUP_POINT = process.env.NEXT_PUBLIC_PICKUP_POINT?.trim() || null;

function poClosed(t: TripRow): boolean {
  return !!t.poClosesAt && new Date(t.poClosesAt).getTime() < Date.now();
}

const CATEGORIES = ["Fashion", "Skincare", "Snack Bandung", "Sepatu", "Tas", "Hijab", "Elektronik", "Aksesoris", "Lainnya"];

type Item = {
  id: string;
  name: string;
  link: string;
  category: string;
  qty: number;
  maxPrice: number;
  variant: string;
  notes: string;
};

type Contact = {
  name: string;
  phone: string;
  street: string;
  city: string;
  postal: string;
  notes: string;
  deliveryMethod: "delivery" | "pickup";
};

type OutOfStock = "ask" | "substitute" | "cancel";

const STEPS = [
  { id: 1, label: "Barang", icon: ShoppingBag },
  { id: 2, label: "Pengiriman", icon: Truck },
  { id: 3, label: "Kontak & alamat", icon: MapPin },
  { id: 4, label: "Cek & kirim", icon: ClipboardCheck },
] as const;

const DRAFT_KEY = "bb_request_draft_v1";

// The first row needs a stable id: it is rendered on the server too, and a
// random id there would differ from the client's (hydration mismatch on
// every label/input pair). Rows added later can use random ids.
const newItem = (id: string = crypto.randomUUID()): Item => ({
  id,
  name: "",
  link: "",
  category: "Fashion",
  qty: 1,
  maxPrice: 0,
  variant: "",
  notes: "",
});

const emptyContact: Contact = {
  name: "",
  phone: "",
  street: "",
  city: "Samarinda",
  postal: "",
  notes: "",
  deliveryMethod: "delivery",
};

type Errors = Record<string, string>;

function validatePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return /^(62|0)?8\d{7,12}$/.test(digits);
}

type StepState = {
  items: Item[];
  isCatalog: boolean;
  tier: TierId;
  tripId: string | null;
  contact: Contact;
  kilatBlocked: string | null;
};

function stepErrors(step: number, state: StepState): Errors {
  const errors: Errors = {};
  if (step === 1 && !state.isCatalog) {
    state.items.forEach((it, i) => {
      if (it.name.trim().length < 2) errors[`item-${i}-name`] = "Tulis nama barangnya";
      if (it.link.trim() && !/^https?:\/\/\S+$/i.test(it.link.trim())) errors[`item-${i}-link`] = "Link harus diawali http(s)://";
      if (!it.maxPrice || it.maxPrice < 1000) errors[`item-${i}-maxPrice`] = "Isi batas harga per barang";
    });
  }
  if (step === 2 && state.tier === "batch" && !state.tripId) errors.trip = "Pilih jadwal Open Trip";
  if (step === 2 && state.tier === "air" && state.kilatBlocked) errors.tier = state.kilatBlocked;
  if (step === 3) {
    const c = state.contact;
    if (c.name.trim().length < 2) errors.name = "Isi nama penerima";
    if (!validatePhone(c.phone)) errors.phone = "Nomor WhatsApp tidak valid (contoh 0812xxxxxxx)";
    const pickup = c.deliveryMethod === "pickup";
    if (!pickup && c.street.trim().length < 5) errors.street = "Alamat terlalu singkat";
    if (c.city.trim().length < 2) errors.city = "Isi kota";
    if (!pickup && !/^\d{5}$/.test(c.postal.trim())) errors.postal = "Kode pos 5 digit";
  }
  return errors;
}

export function RequestFlow({ mode = "request" }: { mode?: "request" | "catalog" }) {
  const isCatalog = mode === "catalog";
  const cartLines = useSyncExternalStore(cart.subscribe, cart.get, cart.getServer);

  const [step, setStep] = useState(1);
  const [items, setItems] = useState<Item[]>(() => [newItem("item-1")]);
  const [contact, setContact] = useState<Contact>(emptyContact);
  const [outOfStock, setOutOfStock] = useState<OutOfStock>("ask");
  const [customerNotes, setCustomerNotes] = useState("");
  const [tierChoice, setTierChoice] = useState<TierId | null>(null);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [tripId, setTripId] = useState<string | null>(null);
  // Errors appear only after the visitor tries to continue, then update
  // live as they type (so a fixed field stops showing its message).
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; token: string; status: string; total: number } | null>(null);

  useEffect(() => {
    track("request_start", { mode });
  }, [mode]);

  // Restore the draft (request mode) so a refresh doesn't wipe the form.
  useEffect(() => {
    if (isCatalog) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as { items?: Item[]; contact?: Contact; outOfStock?: OutOfStock };
      // Draft lives in localStorage, which only exists after hydration, so
      // it has to be restored from an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (draft.items?.length) setItems(draft.items);
      if (draft.contact) setContact({ ...emptyContact, ...draft.contact });
      if (draft.outOfStock) setOutOfStock(draft.outOfStock);
    } catch {
      /* ignore broken drafts */
    }
  }, [isCatalog]);

  useEffect(() => {
    if (isCatalog || result) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ items, contact, outOfStock }));
    } catch {
      /* storage unavailable */
    }
  }, [items, contact, outOfStock, isCatalog, result]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/trips", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: TripRow[] };
        if (cancelled) return;
        const rows = (Array.isArray(json.data) ? json.data : []).filter(
          (t) => t.status !== "in_transit" && t.status !== "closed",
        );
        setTrips(rows);
      } catch {
        // No schedule → Reguler still works; Kargo shows an empty state.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalKg = useMemo(() => {
    if (isCatalog) return cartLines.reduce((sum, l) => sum + (l.weightKg || 0.5) * l.qty, 0);
    return items.reduce((sum, it) => sum + estimateItemWeightKg(it.category, it.qty), 0);
  }, [isCatalog, cartLines, items]);

  const itemsTotal = useMemo(() => {
    if (isCatalog) return cartLines.reduce((sum, l) => sum + l.price * l.qty, 0);
    return items.reduce((sum, it) => sum + (it.maxPrice || 0) * (it.qty || 1), 0);
  }, [isCatalog, cartLines, items]);

  const recommended = recommendTier(totalKg);
  const tier: TierId = tierChoice ?? recommended;
  const pricing = useMemo(() => computePricing({ itemsTotal, totalKg, tier }), [itemsTotal, totalKg, tier]);
  const trip = trips.find((t) => t.id === tripId) ?? null;
  const blockedItem = isCatalog ? null : items.find((it) => KILAT_BLOCKED_CATEGORIES.includes(it.category));
  const kilatBlocked = blockedItem
    ? `${blockedItem.name || blockedItem.category} tidak bisa dikirim lewat pesawat (baterai lithium). Pilih Reguler atau Kargo.`
    : null;
  const stepState: StepState = { items, isCatalog, tier, tripId, contact, kilatBlocked };
  const errors: Errors = showErrors ? stepErrors(step, stepState) : {};

  const goNext = () => {
    const errs = stepErrors(step, stepState);
    if (Object.keys(errs).length) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    track("request_step", { step: step + 1, mode });
    setStep((s) => Math.min(STEPS.length, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (submitting) return;
    for (const s of [1, 2, 3]) {
      const errs = stepErrors(s, stepState);
      if (Object.keys(errs).length) {
        setShowErrors(true);
        setStep(s);
        return;
      }
    }
    setSubmitting(true);
    setSubmitError(null);
    const payload = {
      source: mode,
      customerName: contact.name.trim(),
      customerPhone: contact.phone.trim(),
      address: {
        street: contact.street.trim(),
        city: contact.city.trim(),
        postal: contact.postal.trim(),
        notes: contact.notes.trim() || undefined,
      },
      tier,
      tripId: tier === "batch" ? tripId : null,
      deliveryMethod: PICKUP_POINT ? contact.deliveryMethod : "delivery",
      items: isCatalog
        ? cartLines.map((l) => ({ name: l.name, productId: l.productId, qty: l.qty, variant: l.variant || undefined }))
        : items.map((it) => ({
            name: it.name.trim(),
            link: it.link.trim() || undefined,
            category: it.category,
            qty: it.qty,
            maxPrice: it.maxPrice,
            variant: it.variant.trim() || undefined,
            notes: it.notes.trim() || undefined,
          })),
      outOfStockPreference: outOfStock,
      customerNotes: customerNotes.trim() || undefined,
      estimatedKg: Number(totalKg.toFixed(2)),
    };
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as
        | { data?: { code: string; trackingToken: string; status: string; estimate?: PricingBreakdown } }
        | null;
      if (!res.ok || !json?.data?.trackingToken) {
        setSubmitError(errorMessage(json, "Request belum terkirim. Coba lagi, atau kirim lewat WhatsApp."));
        setSubmitting(false);
        return;
      }
      const data = json.data;
      const total = data.estimate?.total ?? pricing.total;
      rememberOrderLink({
        token: data.trackingToken,
        code: data.code,
        createdAt: new Date().toISOString(),
        itemCount: payload.items.length,
        estimateTotal: total,
      });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      if (isCatalog) cart.clear();
      track(isCatalog ? "checkout_submit" : "request_submit", { tier, items: payload.items.length });
      setResult({ code: data.code, token: data.trackingToken, status: data.status, total });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("Koneksi terputus. Cek internetmu lalu coba lagi, atau kirim lewat WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const waSummary = () => {
    const lines = isCatalog
      ? cartLines.map((l) => `- ${l.name}${l.variant ? ` (${l.variant})` : ""} × ${l.qty}`)
      : items.map((it) => `- ${it.name || "Barang"}${it.variant ? ` (${it.variant})` : ""} × ${it.qty}, maks ${formatIDR(it.maxPrice)}${it.link ? `\n  ${it.link}` : ""}`);
    return [
      result ? `Halo Bawabawa, ini pesanan ${result.code}.` : "Halo Bawabawa, saya mau titip:",
      ...lines,
      `Layanan: ${TIERS[tier].label}`,
      contact.name ? `Nama: ${contact.name}` : "",
      contact.city ? `Kota: ${contact.city}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };

  if (result) {
    return <SuccessCard result={result} waText={waSummary()} isCatalog={isCatalog} />;
  }

  if (isCatalog && cartLines.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <ShoppingBag className="mx-auto h-8 w-8 text-[hsl(var(--muted-foreground))]" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold">Keranjangmu masih kosong</h2>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Pilih barang dari katalog, atau titip barang apa saja lewat form request.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild variant="primary">
            <Link href="/katalog">Lihat katalog</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/request">Titip barang lain</Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8">
        <Stepper step={step} onJump={(s) => s < step && setStep(s)} />
        <div className="mt-6">
          {step === 1 &&
            (isCatalog ? (
              <CartStep lines={cartLines} />
            ) : (
              <ItemsStep items={items} setItems={setItems} errors={errors} />
            ))}
          {step === 2 && (
            <ShippingStep
              tier={tier}
              recommended={recommended}
              totalKg={totalKg}
              setTier={setTierChoice}
              trips={trips}
              tripId={tripId}
              setTripId={setTripId}
              error={errors.trip}
              tierError={errors.tier}
              kilatBlocked={kilatBlocked}
            />
          )}
          {step === 3 && <ContactStep contact={contact} setContact={setContact} errors={errors} />}
          {step === 4 && (
            <ReviewStep
              isCatalog={isCatalog}
              outOfStock={outOfStock}
              setOutOfStock={setOutOfStock}
              customerNotes={customerNotes}
              setCustomerNotes={setCustomerNotes}
              contact={contact}
              tier={tier}
              trip={trip}
              submitError={submitError}
              waHref={waLink(waSummary())}
            />
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali
          </Button>
          {step < STEPS.length ? (
            <Button variant="primary" onClick={goNext}>
              Lanjut <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button variant="accent" size="lg" onClick={submit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Mengirim…
                </>
              ) : isCatalog ? (
                <>Pesan sekarang</>
              ) : (
                <>Kirim request</>
              )}
            </Button>
          )}
        </div>
      </div>

      <aside className="lg:col-span-4">
        <SummaryCard
          isCatalog={isCatalog}
          lines={isCatalog ? cartLines.map((l) => ({ label: l.name, qty: l.qty, amount: l.price * l.qty })) : items.map((it, i) => ({ label: it.name || `Barang #${i + 1}`, qty: it.qty, amount: (it.maxPrice || 0) * it.qty }))}
          pricing={pricing}
          trip={trip}
          tier={tier}
        />
      </aside>
    </div>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (s: number) => void }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4 text-sm" aria-label="Langkah pemesanan">
      {STEPS.map((s, idx) => {
        const done = step > s.id;
        const active = step === s.id;
        return (
          <li key={s.id} className="flex items-center gap-2 sm:gap-3 min-w-0" aria-current={active ? "step" : undefined}>
            <button
              type="button"
              onClick={() => onJump(s.id)}
              disabled={!done}
              className={cn(
                "h-8 w-8 rounded-full grid place-items-center transition-all shrink-0",
                done && "bg-[hsl(var(--emerald-500))] text-white",
                active && "bg-[hsl(var(--sage-700))] text-[hsl(var(--primary-foreground))]",
                !done && !active && "bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]",
              )}
              aria-label={`Langkah ${s.id}: ${s.label}${done ? " (selesai, klik untuk kembali)" : ""}`}
            >
              {done ? <CircleCheck className="h-4 w-4" aria-hidden /> : <s.icon className="h-4 w-4" aria-hidden />}
            </button>
            <span
              className={cn(
                "hidden sm:inline truncate",
                active ? "text-[hsl(var(--foreground))] font-medium" : "text-[hsl(var(--muted-foreground))]",
              )}
            >
              {s.label}
            </span>
            {idx < STEPS.length - 1 && <div className="hidden sm:block h-px w-6 bg-[hsl(var(--border))]" />}
          </li>
        );
      })}
    </ol>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-[hsl(var(--danger))]">
      {message}
    </p>
  );
}

function ItemsStep({ items, setItems, errors }: { items: Item[]; setItems: (v: Item[]) => void; errors: Errors }) {
  const update = (id: string, patch: Partial<Item>) => setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: string) => setItems(items.length > 1 ? items.filter((i) => i.id !== id) : items);

  return (
    <GlassCard className="p-5 sm:p-6">
      <h2 className="text-base font-semibold">Mau titip apa?</h2>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
        Tempel link atau tulis nama barangnya. Tim kami cek stok & harga asli dulu, lalu kirim penawaran — kamu baru bayar setelah setuju.
      </p>
      <div className="mt-5 flex flex-col gap-4">
        {items.map((it, idx) => {
          const e = (f: string) => errors[`item-${idx}-${f}`];
          const fid = (f: string) => `item-${it.id}-${f}`;
          return (
            <fieldset key={it.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <legend className="text-sm font-semibold">Barang #{idx + 1}</legend>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--danger))] inline-flex items-center gap-1.5 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden /> Hapus
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 grid gap-1.5">
                  <Label htmlFor={fid("name")}>Nama barang</Label>
                  <Input
                    id={fid("name")}
                    value={it.name}
                    onChange={(ev) => update(it.id, { name: ev.target.value })}
                    placeholder="Contoh: Sepatu Compass Gazelle Hi"
                    aria-invalid={!!e("name")}
                    aria-describedby={e("name") ? `${fid("name")}-err` : undefined}
                  />
                  <FieldError id={`${fid("name")}-err`} message={e("name")} />
                </div>
                <div className="sm:col-span-2 grid gap-1.5">
                  <Label htmlFor={fid("link")}>
                    Link produk <span className="font-normal text-[hsl(var(--muted-foreground))]">— opsional</span>
                  </Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" aria-hidden />
                    <Input
                      id={fid("link")}
                      inputMode="url"
                      value={it.link}
                      onChange={(ev) => update(it.id, { link: ev.target.value })}
                      placeholder="https://shopee.co.id/… atau link IG toko"
                      className="pl-10"
                      aria-invalid={!!e("link")}
                    />
                  </div>
                  <FieldError id={`${fid("link")}-err`} message={e("link")} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={fid("variant")}>
                    Varian <span className="font-normal text-[hsl(var(--muted-foreground))]">— ukuran/warna/rasa</span>
                  </Label>
                  <Input
                    id={fid("variant")}
                    value={it.variant}
                    onChange={(ev) => update(it.id, { variant: ev.target.value })}
                    placeholder="Hitam, ukuran 40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor={fid("category")}>Kategori</Label>
                    <select
                      id={fid("category")}
                      value={it.category}
                      onChange={(ev) => update(it.id, { category: ev.target.value })}
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
                    <Label htmlFor={fid("qty")}>Jumlah</Label>
                    <Input
                      id={fid("qty")}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={99}
                      value={it.qty}
                      onChange={(ev) => update(it.id, { qty: Math.min(99, Math.max(1, Number(ev.target.value) || 1)) })}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 grid gap-1.5">
                  <Label htmlFor={fid("maxPrice")}>Batas harga maksimal per barang</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--muted-foreground))]">Rp</span>
                    <Input
                      id={fid("maxPrice")}
                      inputMode="numeric"
                      value={it.maxPrice ? it.maxPrice.toLocaleString("id-ID") : ""}
                      onChange={(ev) => update(it.id, { maxPrice: Number(ev.target.value.replace(/\D/g, "")) || 0 })}
                      placeholder="450.000"
                      className="pl-10"
                      aria-invalid={!!e("maxPrice")}
                      aria-describedby={`${fid("maxPrice")}-hint`}
                    />
                  </div>
                  <p id={`${fid("maxPrice")}-hint`} className="text-xs text-[hsl(var(--muted-foreground))]">
                    Kami hanya membelikan kalau harganya ≤ batas ini. Lebih mahal? Kami tanya kamu dulu.
                  </p>
                  <FieldError id={`${fid("maxPrice")}-err`} message={e("maxPrice")} />
                </div>
                <div className="sm:col-span-2 grid gap-1.5">
                  <Label htmlFor={fid("notes")}>
                    Catatan <span className="font-normal text-[hsl(var(--muted-foreground))]">— opsional</span>
                  </Label>
                  <Textarea
                    id={fid("notes")}
                    value={it.notes}
                    onChange={(ev) => update(it.id, { notes: ev.target.value })}
                    placeholder="Contoh: kalau hitam habis, ambil abu-abu. Minta dus asli."
                  />
                </div>
              </div>
            </fieldset>
          );
        })}
        <Button type="button" variant="outline" onClick={() => setItems([...items, newItem()])}>
          <Plus className="h-4 w-4" aria-hidden /> Tambah barang
        </Button>
        <p className="flex items-start gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <Camera className="h-4 w-4 shrink-0" aria-hidden />
          Punya foto/screenshot barangnya? Kirim lewat WhatsApp setelah request terkirim — tombolnya ada di halaman berikut.
        </p>
      </div>
    </GlassCard>
  );
}

function CartStep({ lines }: { lines: CartLine[] }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Keranjang</h2>
        <Link href="/katalog" className="text-sm text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] hover:underline">
          + Tambah dari katalog
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-[hsl(var(--border))]">
        {lines.map((l) => (
          <li key={`${l.productId}-${l.variant ?? ""}`} className="py-3 flex items-center gap-3">
            {l.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover bg-[hsl(var(--surface-2))]" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-[hsl(var(--surface-2))] grid place-items-center">
                <ShoppingBag className="h-5 w-5 text-[hsl(var(--muted-foreground))]" aria-hidden />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{l.name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {l.variant ? `${l.variant} · ` : ""}
                {formatIDR(l.price)}
              </p>
            </div>
            <QtyStepper value={l.qty} label={l.name} onChange={(qty) => cart.setQty(l, qty)} />
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export function QtyStepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[hsl(var(--border))]">
      <button
        type="button"
        className="h-9 w-9 grid place-items-center rounded-full hover:bg-[hsl(var(--surface-2))]"
        onClick={() => onChange(value - 1)}
        aria-label={`Kurangi ${label}`}
      >
        {value <= 1 ? <Trash2 className="h-3.5 w-3.5" aria-hidden /> : <Minus className="h-3.5 w-3.5" aria-hidden />}
      </button>
      <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="h-9 w-9 grid place-items-center rounded-full hover:bg-[hsl(var(--surface-2))]"
        onClick={() => onChange(value + 1)}
        aria-label={`Tambah ${label}`}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

function ShippingStep({
  tier,
  recommended,
  totalKg,
  setTier,
  trips,
  tripId,
  setTripId,
  error,
  tierError,
  kilatBlocked,
}: {
  tier: TierId;
  recommended: TierId;
  totalKg: number;
  setTier: (v: TierId) => void;
  trips: TripRow[];
  tripId: string | null;
  setTripId: (v: string) => void;
  error?: string;
  tierError?: string;
  kilatBlocked: string | null;
}) {
  const tiers = availableTiers();
  const fees: Record<TierId, number> = {
    fast: shippingFeeFor("fast", totalKg),
    batch: shippingFeeFor("batch", totalKg),
    air: shippingFeeFor("air", totalKg),
  };
  const saving = Math.abs(fees.fast - fees.batch);
  return (
    <div className="space-y-4">
      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-base font-semibold">Pilih pengiriman</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Estimasi berat ±{totalKg.toFixed(1)} kg. Kami sudah pilihkan yang paling hemat — kamu tetap bisa ganti.
        </p>
        <div
          className={cn("mt-5 grid grid-cols-1 gap-3", tiers.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}
          role="radiogroup"
          aria-label="Layanan pengiriman"
        >
          {tiers.map((id) => {
            const t = TIERS[id];
            const active = tier === t.id;
            const Icon = t.id === "air" ? Zap : Truck;
            const disabled = t.id === "air" && !!kilatBlocked;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={disabled}
                onClick={() => !disabled && setTier(t.id)}
                className={cn(
                  "text-left rounded-2xl border p-5 transition-all",
                  active
                    ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.25)] ring-2 ring-[hsl(var(--sage-700))]/30"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]",
                  disabled && "opacity-60 cursor-not-allowed",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 rounded-xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="font-semibold">{t.label}</p>
                  {t.id === recommended && (
                    <Badge variant="success" className="ml-auto">
                      Paling hemat
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-lg font-semibold tabular-nums">{formatIDR(fees[t.id])}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.tagline}</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Tiba {t.eta}</p>
                {t.id === "air" && KILAT && KILAT.minKg > 0.5 && (
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Minimal {KILAT.minKg} kg dihitung</p>
                )}
                {disabled && <p className="mt-2 text-xs text-[hsl(var(--danger))]">Ada barang ber-baterai — tidak bisa lewat udara.</p>}
              </button>
            );
          })}
        </div>
        {tierError && (
          <p role="alert" className="mt-3 text-xs text-[hsl(var(--danger))]">
            {tierError}
          </p>
        )}
        {tier === "air" && (
          <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
            Kilat lewat pesawat: parfum, aerosol, dan cairan mudah terbakar tidak bisa ikut — kami infokan kalau ada barang yang harus pindah layanan.
          </p>
        )}
        {tier !== recommended && tier !== "air" && saving > 0 && (
          <p className="mt-3 text-xs text-[hsl(var(--warning))]">
            {TIERS[recommended].label} lebih hemat {formatIDR(saving)} untuk berat ini.
          </p>
        )}
      </GlassCard>

      {tier === "batch" && (
        <GlassCard className="p-5 sm:p-6">
          <h3 className="text-base font-semibold">Pilih jadwal Open Trip</h3>
          {trips.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[hsl(var(--border))] p-5 text-sm text-[hsl(var(--muted-foreground))]">
              Belum ada jadwal Open Trip yang dibuka. Pilih <strong>Reguler</strong>, atau pantau{" "}
              <Link href="/open-trip" className="underline">
                jadwal Open Trip
              </Link>
              .
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup" aria-label="Jadwal Open Trip">
              {trips.map((t) => {
                const left = Math.max(0, t.capacityKg - t.bookedKg);
                const closed = poClosed(t);
                const isFull = t.status === "fullbooked" || left <= 0 || closed;
                const active = tripId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => !isFull && setTripId(t.id)}
                    disabled={isFull}
                    className={cn(
                      "text-left rounded-2xl border p-4 transition-all",
                      active
                        ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.25)] ring-2 ring-[hsl(var(--sage-700))]/30"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]",
                      isFull && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{t.code}</p>
                      {closed ? (
                        <Badge variant="neutral">PO tutup</Badge>
                      ) : isFull ? (
                        <Badge variant="warning">Penuh</Badge>
                      ) : (
                        <Badge variant="success">{left} kg tersisa</Badge>
                      )}
                    </div>
                    <p className="mt-1.5 font-semibold">
                      Berangkat {formatDate(t.departAt, { weekday: "long", day: "numeric", month: "short", year: undefined })}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {t.arriveEstimateAt
                        ? `Estimasi tiba ${formatDate(t.arriveEstimateAt, { day: "numeric", month: "short", year: undefined })}`
                        : "Estimasi tiba diinfokan saat berangkat"}
                    </p>
                    {t.poClosesAt && !closed && (
                      <p className="mt-1 text-xs font-medium text-[hsl(var(--warning))]">
                        PO tutup {formatDate(t.poClosesAt, { weekday: "short", day: "numeric", month: "short", year: undefined, hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <FieldError id="trip-err" message={error} />
        </GlassCard>
      )}
    </div>
  );
}

function ContactStep({ contact, setContact, errors }: { contact: Contact; setContact: (c: Contact) => void; errors: Errors }) {
  const field = (key: keyof Contact) => ({
    id: `contact-${key}`,
    value: contact[key],
    onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setContact({ ...contact, [key]: ev.target.value }),
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `contact-${key}-err` : undefined,
  });
  const pickup = !!PICKUP_POINT && contact.deliveryMethod === "pickup";
  return (
    <GlassCard className="p-5 sm:p-6">
      <h2 className="text-base font-semibold">{pickup ? "Kontak penerima" : "Kontak & alamat penerima"}</h2>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
        Update pesanan dikirim ke WhatsApp ini. Tidak perlu bikin akun.
      </p>
      {PICKUP_POINT && (
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Cara terima barang</legend>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(
              [
                ["delivery", "Antar ke alamat", "Kurir lokal sampai depan rumah."],
                ["pickup", "Ambil sendiri", PICKUP_POINT],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 cursor-pointer",
                  contact.deliveryMethod === value
                    ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.25)]"
                    : "border-[hsl(var(--border))]",
                )}
              >
                <input
                  type="radio"
                  name="delivery-method"
                  value={value}
                  checked={contact.deliveryMethod === value}
                  onChange={() => setContact({ ...contact, deliveryMethod: value })}
                  className="mt-1 accent-[hsl(var(--sage-700))]"
                />
                <span className="text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="block text-xs text-[hsl(var(--muted-foreground))]">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="contact-name">Nama penerima</Label>
          <Input {...field("name")} autoComplete="name" placeholder="Aulia Putri" />
          <FieldError id="contact-name-err" message={errors.name} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="contact-phone">No. WhatsApp</Label>
          <Input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890" />
          <FieldError id="contact-phone-err" message={errors.phone} />
        </div>
        {!pickup && (
          <div className="sm:col-span-2 grid gap-1.5">
            <Label htmlFor="contact-street">Alamat lengkap</Label>
            <Textarea {...field("street")} autoComplete="street-address" placeholder="Jl. Pahlawan No. 10, RT 03/RW 02, Kel. …" />
            <FieldError id="contact-street-err" message={errors.street} />
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="contact-city">Kota</Label>
          <Input {...field("city")} autoComplete="address-level2" />
          <FieldError id="contact-city-err" message={errors.city} />
        </div>
        {!pickup && (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="contact-postal">Kode pos</Label>
              <Input {...field("postal")} inputMode="numeric" autoComplete="postal-code" maxLength={5} placeholder="75124" />
              <FieldError id="contact-postal-err" message={errors.postal} />
            </div>
            <div className="sm:col-span-2 grid gap-1.5">
              <Label htmlFor="contact-notes">
                Catatan kurir <span className="font-normal text-[hsl(var(--muted-foreground))]">— opsional</span>
              </Label>
              <Input {...field("notes")} placeholder="Pagar hitam, titip ke pos satpam" />
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}

function ReviewStep({
  isCatalog,
  outOfStock,
  setOutOfStock,
  customerNotes,
  setCustomerNotes,
  contact,
  tier,
  trip,
  submitError,
  waHref,
}: {
  isCatalog: boolean;
  outOfStock: OutOfStock;
  setOutOfStock: (v: OutOfStock) => void;
  customerNotes: string;
  setCustomerNotes: (v: string) => void;
  contact: Contact;
  tier: TierId;
  trip: TripRow | null;
  submitError: string | null;
  waHref: string;
}) {
  return (
    <div className="space-y-4">
      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-base font-semibold">Kalau barang habis atau beda?</h2>
        <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Kalau barang habis">
          {(Object.keys(OUT_OF_STOCK_LABEL) as OutOfStock[]).map((key) => (
            <label
              key={key}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 cursor-pointer",
                outOfStock === key ? "border-[hsl(var(--sage-700))] bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.25)]" : "border-[hsl(var(--border))]",
              )}
            >
              <input
                type="radio"
                name="oos"
                value={key}
                checked={outOfStock === key}
                onChange={() => setOutOfStock(key)}
                className="accent-[hsl(var(--sage-700))]"
              />
              <span className="text-sm">{OUT_OF_STOCK_LABEL[key]}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-1.5">
          <Label htmlFor="customer-notes">
            Pesan untuk tim <span className="font-normal text-[hsl(var(--muted-foreground))]">— opsional</span>
          </Label>
          <Textarea id="customer-notes" value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Contoh: butuh sebelum tanggal 20." />
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6 text-sm">
        <h3 className="font-semibold">Dikirim ke</h3>
        <p className="mt-2">
          {contact.name} · {contact.phone}
        </p>
        <p className="text-[hsl(var(--muted-foreground))]">
          {contact.deliveryMethod === "pickup" && PICKUP_POINT
            ? `Ambil sendiri di ${PICKUP_POINT}`
            : `${contact.street}, ${contact.city} ${contact.postal}`}
        </p>
        <p className="mt-3">
          Layanan <strong>{TIERS[tier].label}</strong>
          {tier === "batch" && trip ? ` · Open Trip ${trip.code}` : ""}
        </p>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6 text-sm">
        <h3 className="font-semibold">Yang terjadi setelah ini</h3>
        <ol className="mt-3 space-y-2 list-decimal pl-5 text-[hsl(var(--muted-foreground))]">
          {isCatalog ? (
            <>
              <li>Kamu dapat link tracking + instruksi pembayaran (juga lewat WhatsApp).</li>
              <li>Setelah pembayaran dikonfirmasi, barang kami belikan & kemas.</li>
              <li>Resi dikirim ke WhatsApp-mu saat barang berangkat.</li>
            </>
          ) : (
            <>
              <li>Tim cek stok & harga asli (biasanya ≤ 2 jam di jam kerja).</li>
              <li>Kamu terima penawaran harga final lewat WhatsApp & link tracking.</li>
              <li>Setujui → bayar → barang dibelikan, dikemas, dan dikirim.</li>
            </>
          )}
        </ol>
        <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          Dengan mengirim, kamu menyetujui{" "}
          <Link href="/terms" className="underline">
            syarat layanan
          </Link>{" "}
          dan{" "}
          <Link href="/privacy" className="underline">
            kebijakan privasi
          </Link>
          .
        </p>
      </GlassCard>

      {submitError && (
        <div role="alert" className="rounded-2xl border border-[hsl(var(--danger)/0.4)] bg-[hsl(var(--danger)/0.08)] p-4 text-sm">
          <p className="font-medium text-[hsl(var(--danger))]">{submitError}</p>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 underline">
            <MessageCircle className="h-4 w-4" aria-hidden /> Kirim lewat WhatsApp saja
          </a>
        </div>
      )}
    </div>
  );
}

function SuccessCard({
  result,
  waText,
  isCatalog,
}: {
  result: { code: string; token: string; status: string; total: number };
  waText: string;
  isCatalog: boolean;
}) {
  const trackHref = `/track/${result.token}`;
  const [copied, setCopied] = useState(false);
  return (
    <GlassCard className="p-8 sm:p-10 text-center max-w-2xl mx-auto">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-[hsl(var(--emerald-400))] to-[hsl(var(--emerald-600))] grid place-items-center text-white">
        <CircleCheck className="h-8 w-8" aria-hidden />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">
        {isCatalog ? "Pesanan tercatat!" : "Request terkirim!"}
      </h2>
      <p className="mt-1 font-mono text-lg">{result.code}</p>
      <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
        {isCatalog
          ? `Total ${formatIDR(result.total)}. Instruksi pembayaran ada di halaman tracking dan sudah kami kirim ke WhatsApp-mu.`
          : "Tim kami sedang cek stok & harga. Penawaran final dikirim ke WhatsApp-mu — kamu baru bayar setelah setuju."}
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <Button asChild variant="primary" size="lg">
          <Link href={trackHref}>Lihat status pesanan</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href={waLink(`${waText}\nTracking: ${typeof window !== "undefined" ? window.location.origin : ""}${trackHref}`)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden /> Kirim foto / tanya via WA
          </a>
        </Button>
      </div>
      <button
        type="button"
        className="mt-4 text-xs text-[hsl(var(--muted-foreground))] underline"
        onClick={() => {
          void navigator.clipboard?.writeText(`${window.location.origin}${trackHref}`).then(() => setCopied(true));
        }}
      >
        {copied ? "Link tracking tersalin ✓" : "Salin link tracking"}
      </button>
    </GlassCard>
  );
}

function SummaryCard({
  isCatalog,
  lines,
  pricing,
  trip,
  tier,
}: {
  isCatalog: boolean;
  lines: Array<{ label: string; qty: number; amount: number }>;
  pricing: PricingBreakdown;
  trip: TripRow | null;
  tier: TierId;
}) {
  return (
    <div className="lg:sticky lg:top-24">
      <GlassCard className="p-5 sm:p-6">
        <p className="text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
          {isCatalog ? "Ringkasan" : "Estimasi maksimal"}
        </p>
        <div className="mt-4 space-y-2.5 text-sm">
          {lines.map((l, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <span className="text-[hsl(var(--muted-foreground))] truncate">
                {l.label} <span className="text-xs">× {l.qty}</span>
              </span>
              <span className="tabular-nums">{formatIDR(l.amount)}</span>
            </div>
          ))}
          <div className="h-px bg-[hsl(var(--border))]" />
          <Row label="Jasa titip (8%, min Rp20rb)" value={formatIDR(pricing.jastipFee)} />
          <Row label={`Ongkir ${TIERS[tier].label} (${(tier === "air" && KILAT ? Math.max(pricing.billingKg, KILAT.minKg) : pricing.billingKg).toFixed(1)} kg)`} value={formatIDR(pricing.shippingFee)} />
          {PPN_ENABLED && <Row label="PPN 11% (atas jasa & ongkir)" value={formatIDR(pricing.ppn)} />}
          <div className="h-px bg-[hsl(var(--border))]" />
          <div className="flex items-center justify-between">
            <span className="font-semibold">{isCatalog ? "Total" : "Total maks."}</span>
            <span className="text-lg font-semibold tabular-nums">{formatIDR(pricing.total)}</span>
          </div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            {isCatalog
              ? "Ongkir dihitung dari estimasi berat; selisih setelah ditimbang diinfokan sebelum dikirim."
              : "Harga final mengikuti harga asli di toko (tidak melebihi batasmu tanpa persetujuan)."}
            {tier === "batch" && trip?.arriveEstimateAt
              ? ` Estimasi tiba ${formatDate(trip.arriveEstimateAt, { day: "numeric", month: "short", year: undefined })}.`
              : ""}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
