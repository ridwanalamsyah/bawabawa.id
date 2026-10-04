"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatIDR, formatDate } from "@/lib/utils";
import { errorMessage } from "@/lib/order-requests";

/** Row as returned by GET /vouchers (snake_case straight from the DB). */
type Voucher = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number | string;
  min_order_amount: number | string | null;
  max_uses: number | null;
  used_count: number | null;
  ends_at: string | null;
  is_active: boolean;
  is_public: boolean;
  banner_label: string | null;
};

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

export function VouchersClient() {
  const [rows, setRows] = React.useState<Voucher[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/vouchers", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(data)) {
      setError(errorMessage(data, "Daftar promo belum bisa dimuat. Coba muat ulang."));
      return;
    }
    setError(null);
    setRows(data as Voucher[]);
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/vouchers/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) setError(errorMessage(await res.json().catch(() => null), "Gagal menyimpan"));
    await load();
  }

  return (
    <div className="space-y-4">
      <CreateVoucher onCreated={load} />
      {error && <GlassCard className="p-4 text-sm text-[hsl(var(--rose-700))]">{error}</GlassCard>}
      {!rows && !error && <GlassCard className="p-6 text-sm text-[hsl(var(--muted-foreground))]">Memuat…</GlassCard>}
      {rows?.length === 0 && (
        <GlassCard className="p-6 text-sm text-[hsl(var(--muted-foreground))]">
          Belum ada kode promo. Tekan &ldquo;Buat kode promo&rdquo; untuk mulai.
        </GlassCard>
      )}
      <ul className="grid gap-3 lg:grid-cols-2">
        {rows?.map((v) => (
          <li key={v.id}>
            <VoucherRow v={v} onPatch={(b) => patch(v.id, b)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function VoucherRow({ v, onPatch }: { v: Voucher; onPatch: (b: Record<string, unknown>) => Promise<void> }) {
  const [label, setLabel] = React.useState(v.banner_label ?? "");
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const run = async (b: Record<string, unknown>) => {
    setBusy(true);
    await onPatch(b);
    setBusy(false);
  };
  const value = v.discount_type === "percentage" ? `${num(v.discount_value)}%` : formatIDR(num(v.discount_value));
  const details = [
    `Dipakai ${v.used_count ?? 0}${typeof v.max_uses === "number" ? ` dari ${v.max_uses}` : "x"}`,
    num(v.min_order_amount) > 0 ? `min. belanja ${formatIDR(num(v.min_order_amount))}` : null,
    v.ends_at ? `sampai ${formatDate(v.ends_at, { day: "numeric", month: "short" })}` : null,
  ].filter(Boolean);
  return (
    <GlassCard className={"p-4 " + (v.is_active ? "" : "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-base font-semibold">{v.code}</span>
            <span className="text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">− {value}</span>
          </p>
          <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{details.join(" · ")}</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          {v.is_active ? "Aktif" : "Mati"}
          <Switch checked={v.is_active} disabled={busy} label={`Aktifkan ${v.code}`} onChange={(on) => void run({ isActive: on })} />
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] pt-3">
        <span className="text-sm">Tampil di banner beranda</span>
        <Switch
          checked={v.is_public}
          disabled={busy || !v.is_active}
          label={`Tampilkan ${v.code} di banner`}
          onChange={(on) => void run({ isPublic: on })}
        />
      </div>
      {v.is_public && (
        <div className="mt-3 flex gap-2">
          <Input
            aria-label="Teks banner"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setSaved(false);
            }}
            placeholder={`Pakai kode ${v.code}, hemat ${value}`}
          />
          <Button
            variant="outline"
            disabled={busy || label === (v.banner_label ?? "")}
            onClick={async () => {
              await run({ bannerLabel: label.trim() || null });
              setSaved(true);
            }}
          >
            {saved ? "Tersimpan" : "Simpan"}
          </Button>
        </div>
      )}
    </GlassCard>
  );
}

function CreateVoucher({ onCreated }: { onCreated: () => Promise<void> }) {
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ code: "", type: "fixed", value: "", min: "", ends: "", desc: "", quota: "", once: true });
  const [busy, setBusy] = React.useState(false);
  const [more, setMore] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const value = Number(f.value);
    if (f.code.trim().length < 2 || !(value > 0)) return setErr("Isi kode dan nilai diskon.");
    setBusy(true);
    const res = await fetch("/api/admin/vouchers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: f.code.trim().toUpperCase(),
        discountType: f.type,
        discountValue: value,
        minOrderAmount: Number(f.min) > 0 ? Number(f.min) : undefined,
        endsAt: f.ends ? new Date(`${f.ends}T23:59:59`).toISOString() : undefined,
        description: f.desc.trim() || undefined,
        maxUses: Number(f.quota) > 0 ? Math.round(Number(f.quota)) : undefined,
        perUserLimit: f.once ? 1 : undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) return setErr(errorMessage(await res.json().catch(() => null), "Kode promo belum tersimpan. Coba lagi."));
    setF({ code: "", type: "fixed", value: "", min: "", ends: "", desc: "", quota: "", once: true });
    setOpen(false);
    await onCreated();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Buat kode promo
      </Button>
    );
  }
  return (
    <GlassCard className="p-5">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="v-code">Kode</Label>
          <Input id="v-code" value={f.code} onChange={set("code")} placeholder="HEMAT20" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="v-type">Jenis</Label>
          <select id="v-type" value={f.type} onChange={set("type")} className="h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--bg))] px-3 text-sm">
            <option value="fixed">Potongan Rupiah</option>
            <option value="percentage">Persen (%)</option>
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="v-value">Nilai</Label>
          <Input id="v-value" value={f.value} onChange={set("value")} inputMode="numeric" placeholder={f.type === "fixed" ? "20000" : "10"} />
        </div>
        {more ? (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="v-min">Minimal belanja (opsional)</Label>
              <Input id="v-min" value={f.min} onChange={set("min")} inputMode="numeric" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="v-ends">Berlaku sampai (opsional)</Label>
              <Input id="v-ends" type="date" value={f.ends} onChange={set("ends")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="v-quota">Kuota pemakaian (opsional)</Label>
              <Input id="v-quota" value={f.quota} onChange={set("quota")} inputMode="numeric" placeholder="100" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="v-desc">Catatan untuk tim (tidak tampil ke pelanggan)</Label>
              <Input id="v-desc" value={f.desc} onChange={set("desc")} />
            </div>
            <label className="sm:col-span-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.once} onChange={(e) => setF({ ...f, once: e.target.checked })} />
              Satu kali per pelanggan (per nomor WhatsApp)
            </label>
          </>
        ) : (
          <button type="button" onClick={() => setMore(true)} className="sm:col-span-3 justify-self-start text-sm font-medium underline underline-offset-2">
            Atur lebih lanjut (minimal belanja, batas waktu, kuota)
          </button>
        )}
        <p className="sm:col-span-3 text-xs text-[hsl(var(--muted-foreground))]">
          Potongan berlaku untuk jasa titip + ongkir, tidak memotong harga barang dari toko.
        </p>
        {err && <p className="sm:col-span-3 text-sm text-[hsl(var(--rose-700))]">{err}</p>}
        <div className="sm:col-span-3 flex gap-2">
          <Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan</Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
        </div>
      </form>
    </GlassCard>
  );
}
