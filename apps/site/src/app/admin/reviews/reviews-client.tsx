"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { errorMessage } from "@/lib/order-requests";

type Review = {
  id: string;
  customerName: string;
  city: string | null;
  rating: number;
  body: string;
  isPublished: boolean;
  isVerified: boolean;
  createdAt: string;
};

export function ReviewsClient() {
  const [rows, setRows] = React.useState<Review[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reviews", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data)) {
        setError(errorMessage(data, `Gagal memuat (${res.status})`));
        return;
      }
      setError(null);
      setRows(data as Review[]);
    } catch {
      setError("Gagal terhubung ke server");
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function toggle(r: Review) {
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/reviews/${r.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isPublished: !r.isPublished }),
      });
      if (!res.ok) {
        setError(errorMessage(await res.json().catch(() => null), "Gagal menyimpan"));
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (error) return <GlassCard className="p-6 text-sm text-[hsl(var(--rose-700))]">{error}</GlassCard>;
  if (!rows) return <GlassCard className="p-6 text-sm text-[hsl(var(--muted-foreground))]">Memuat…</GlassCard>;
  if (rows.length === 0) {
    return (
      <GlassCard className="p-6 text-sm text-[hsl(var(--muted-foreground))]">
        Belum ada ulasan. Customer bisa memberi ulasan dari halaman lacak setelah pesanan berstatus diterima.
      </GlassCard>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id}>
          <GlassCard className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{r.customerName}</span>
                {r.city && <span className="text-sm text-[hsl(var(--muted-foreground))]">· {r.city}</span>}
                <Badge variant={r.isPublished ? "success" : "neutral"}>{r.isPublished ? "Tayang" : "Belum tayang"}</Badge>
              </div>
              <div className="mt-1 flex gap-0.5" aria-label={`${r.rating} dari 5 bintang`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < r.rating ? "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" : "text-[hsl(var(--border))]"}`}
                    aria-hidden
                  />
                ))}
              </div>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{r.body}</p>
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                {formatDate(r.createdAt, { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <Button
              size="sm"
              variant={r.isPublished ? "outline" : "primary"}
              disabled={busy === r.id}
              onClick={() => void toggle(r)}
            >
              {r.isPublished ? "Sembunyikan" : "Tayangkan"}
            </Button>
          </GlassCard>
        </li>
      ))}
    </ul>
  );
}
