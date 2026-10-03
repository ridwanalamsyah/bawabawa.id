"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      setError(errorMessage(data, `Gagal memuat (${res.status})`));
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
          Belum ada voucher. Buat satu di atas — centang &ldquo;Tampilkan di banner&rdquo; supaya muncul di atas hero.
        </GlassCard>
      )}
      <ul className="space-y-3">
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
  const run = async (b: Record<string, unknown>) => {
    setBusy(true);
    await onPatch(b);
    setBusy(false);
  };
  const value = v.discount_type === "percentage" ? `${num(v.discount_value)}%` : formatIDR(num(v.discount_value));
  return (
    <GlassCard className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono font-semibold">{v.code}</span>
        <Badge variant="info">{value}</Badge>
        <Badge variant={v.is_active ? "success" : "neutral"}>{v.is_active ? "Aktif" : "Nonaktif"}</Badge>
        {v.is_public && <Badge variant="warning">Tampil di banner</Badge>}
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {num(v.min_order_amount) > 0 ? `min ${formatIDR(num(v.min_order_amount))} · ` : ""}
          dipakai {v.used_count ?? 0}
          {typeof v.max_uses === "number" ? `/${v.max_uses}` : ""}
          {v.ends_at ? ` · s.d. ${formatDate(v.ends_at, { day: "numeric", month: "short" })}` : ""}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor={`bl-${v.id}`}>Teks banner (kosong = otomatis dari nilai voucher)</Label>
          <Input id={`bl-${v.id}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Diskon ongkir 20rb khusus minggu ini" />
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void run({ bannerLabel: label.trim() || null })}>
          Simpan teks
        </Button>
        <div className="flex gap-2">
          <Button variant={v.is_public ? "outline" : "primary"} disabled={busy} onClick={() => void run({ isPublic: !v.is_public })}>
            {v.is_public ? "Sembunyikan banner" : "Tampilkan di banner"}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => void run({ isActive: !v.is_active })}>
            {v.is_active ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

function CreateVoucher({ onCreated }: { onCreated: () => Promise<void> }) {
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ code: "", type: "fixed", value: "", min: "", ends: "", desc: "" });
  const [busy, setBusy] = React.useState(false);
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
      }),
    });
    setBusy(false);
    if (!res.ok) return setErr(errorMessage(await res.json().catch(() => null), "Gagal membuat voucher"));
    setF({ code: "", type: "fixed", value: "", min: "", ends: "", desc: "" });
    setOpen(false);
    await onCreated();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Voucher baru
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
        <div className="grid gap-1.5">
          <Label htmlFor="v-min">Minimal belanja (opsional)</Label>
          <Input id="v-min" value={f.min} onChange={set("min")} inputMode="numeric" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="v-ends">Berlaku sampai (opsional)</Label>
          <Input id="v-ends" type="date" value={f.ends} onChange={set("ends")} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="v-desc">Catatan internal</Label>
          <Input id="v-desc" value={f.desc} onChange={set("desc")} />
        </div>
        {err && <p className="sm:col-span-3 text-sm text-[hsl(var(--rose-700))]">{err}</p>}
        <div className="sm:col-span-3 flex gap-2">
          <Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan</Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
        </div>
      </form>
    </GlassCard>
  );
}
