"use client";

import * as React from "react";
import { GlassCard } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/utils";

type Branch = { id: string; code: string; name: string };

const CHANNELS = [
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "dm", label: "DM lain" },
  { value: "telepon", label: "Telepon" },
  { value: "email", label: "Email" },
  { value: "marketplace", label: "Marketplace" },
  { value: "walkin", label: "Walk-in" },
  { value: "lainnya", label: "Lainnya" },
] as const;

type Channel = (typeof CHANNELS)[number]["value"];

type CreatedOrder = {
  id: string;
  orderNumber?: string;
  totalAmount?: number | string;
  status?: string;
};

export function PosClient() {
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [branchId, setBranchId] = React.useState("");
  const [totalAmount, setTotalAmount] = React.useState<string>("");
  const [sourceChannel, setSourceChannel] = React.useState<Channel>("instagram");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState<CreatedOrder | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // Branches list is a read-only ERP endpoint, but we route through
        // the same admin BFF /api/admin/* shape so we don't expose the ERP
        // bearer token to the browser.
        const res = await fetch("/api/admin/branches", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Branch[] | { error?: string };
        if (cancelled) return;
        if (Array.isArray(data)) {
          setBranches(data);
          if (data[0] && !branchId) setBranchId(data[0].id);
        }
      } catch {
        // Empty branch list is fine — user can still submit if they paste
        // a UUID, but we surface the empty state in the select.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    if (!customerName.trim() || !customerPhone.trim() || !branchId || !totalAmount) {
      setError("Lengkapi nama, nomor HP, cabang, dan total.");
      return;
    }
    const parsedTotal = Number(totalAmount.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      setError("Total harus angka positif.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/manual-orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          branchId,
          totalAmount: parsedTotal,
          sourceChannel,
          notes: notes.trim() || null,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | (CreatedOrder & { error?: string })
        | { error?: string }
        | null;
      if (!res.ok || !json || (json as { error?: string }).error) {
        const msg =
          (json && (json as { error?: string }).error) || `Gagal (${res.status})`;
        setError(typeof msg === "string" ? msg : "Gagal mengirim order.");
        return;
      }
      setCreated(json as CreatedOrder);
      setCustomerName("");
      setCustomerPhone("");
      setTotalAmount("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal terhubung ke server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <GlassCard className="lg:col-span-7 p-6">
        <h2 className="font-semibold">Form pesanan manual</h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Isi data customer dan total estimasi. Pesanan akan masuk ke ERP dengan
          channel asalnya — jadi semua orderan offline + online tercatat di satu
          tempat.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pos-name">Nama customer</Label>
              <Input
                id="pos-name"
                placeholder="Nama lengkap"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="pos-phone">No. WhatsApp / HP</Label>
              <Input
                id="pos-phone"
                placeholder="08xxxxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pos-branch">Cabang</Label>
              <select
                id="pos-branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm"
              >
                {branches.length === 0 && <option value="">— belum ada cabang —</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} · {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="pos-channel">Asal pesanan</Label>
              <select
                id="pos-channel"
                value={sourceChannel}
                onChange={(e) => setSourceChannel(e.target.value as Channel)}
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2 text-sm"
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="pos-total">Total estimasi (Rp)</Label>
            <Input
              id="pos-total"
              type="text"
              inputMode="numeric"
              placeholder="500000"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Boleh disesuaikan setelah shopper konfirmasi harga aktual.
            </p>
          </div>

          <div>
            <Label htmlFor="pos-notes">Catatan (opsional)</Label>
            <Textarea
              id="pos-notes"
              rows={3}
              placeholder="Detail barang, alamat, atau catatan dari customer…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-[hsl(var(--rose-700))]">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Mengirim…" : "Simpan ke ERP"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCustomerName("");
                setCustomerPhone("");
                setTotalAmount("");
                setNotes("");
                setCreated(null);
                setError(null);
              }}
              disabled={submitting}
            >
              Reset
            </Button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="lg:col-span-5 p-6">
        <h2 className="font-semibold">Hasil terakhir</h2>
        {created ? (
          <div className="mt-3 rounded-xl border border-[hsl(var(--emerald-500)/0.4)] bg-[hsl(var(--emerald-500)/0.08)] p-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="success">Tersimpan</Badge>
              <span className="font-mono text-xs">
                {created.orderNumber ?? created.id}
              </span>
            </div>
            {typeof created.totalAmount !== "undefined" && (
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                Total {formatIDR(Number(created.totalAmount) || 0)}
              </p>
            )}
            <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
              Cek di /admin/orders untuk lanjutan workflow (packing, kirim,
              invoice).
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            Order yang baru disimpan akan tampil di sini sebagai konfirmasi.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
