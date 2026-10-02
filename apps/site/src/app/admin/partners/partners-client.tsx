"use client";

import * as React from "react";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { errorMessage } from "@/lib/order-requests";

type Status = "new" | "contacted" | "active" | "rejected";

type Inquiry = {
  id: string;
  kind: "reseller" | "b2b" | "affiliate";
  name: string;
  phone: string;
  businessName: string | null;
  city: string | null;
  categories: string | null;
  monthlyVolumeKg: number | null;
  message: string | null;
  status: Status;
  createdAt: string;
};

const KIND_LABEL = { reseller: "Reseller", b2b: "B2B", affiliate: "Afiliasi" } as const;
const STATUS_LABEL: Record<Status, string> = {
  new: "Baru",
  contacted: "Sudah dihubungi",
  active: "Aktif",
  rejected: "Ditolak",
};

export function PartnersClient() {
  const [rows, setRows] = React.useState<Inquiry[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/partner-inquiries", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data)) {
        setError(errorMessage(data, `Gagal memuat (${res.status})`));
        return;
      }
      setError(null);
      setRows(data as Inquiry[]);
    } catch {
      setError("Gagal terhubung ke server");
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function setStatus(id: string, status: Status) {
    const res = await fetch(`/api/admin/partner-inquiries/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError(errorMessage(await res.json().catch(() => null), "Gagal menyimpan"));
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status } : r)) ?? prev);
  }

  if (error) return <GlassCard className="p-6 text-sm text-[hsl(var(--rose-700))]">{error}</GlassCard>;
  if (!rows) return <GlassCard className="p-6 text-sm text-[hsl(var(--muted-foreground))]">Memuat…</GlassCard>;
  if (rows.length === 0) {
    return (
      <GlassCard className="p-6 text-sm text-[hsl(var(--muted-foreground))]">
        Belum ada pendaftar. Bagikan link /reseller ke calon mitra.
      </GlassCard>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id}>
          <GlassCard className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-base">{r.name}</span>
                <Badge variant="info">{KIND_LABEL[r.kind]}</Badge>
                {r.businessName && <span className="text-[hsl(var(--muted-foreground))]">{r.businessName}</span>}
              </div>
              <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">
                  {r.phone}
                </a>
                {r.city ? ` · ${r.city}` : ""}
                {r.monthlyVolumeKg ? ` · ±${r.monthlyVolumeKg} kg/bulan` : ""}
                {` · ${formatDate(r.createdAt, { day: "numeric", month: "short" })}`}
              </p>
              {r.categories && <p className="mt-2">{r.categories}</p>}
              {r.message && <p className="mt-1 whitespace-pre-line text-[hsl(var(--muted-foreground))]">{r.message}</p>}
            </div>
            <label className="text-xs text-[hsl(var(--muted-foreground))]">
              <span className="sr-only">Status</span>
              <select
                value={r.status}
                onChange={(e) => void setStatus(r.id, e.target.value as Status)}
                className="h-9 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 text-sm text-[hsl(var(--foreground))]"
              >
                {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          </GlassCard>
        </li>
      ))}
    </ul>
  );
}
