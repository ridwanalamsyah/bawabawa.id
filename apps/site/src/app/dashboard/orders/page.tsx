"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLocalOrderLinks, getServerLocalOrderLinks, subscribeLocalOrderLinks } from "@/lib/local-orders";
import { ORDER_STEP_LABEL, STATUS_BADGE, type OrderRequestStatus } from "@/lib/order-requests";
import { formatDate, formatIDR } from "@/lib/utils";

type MyOrder = {
  code: string;
  trackingToken: string;
  status: OrderRequestStatus | null;
  total: number | null;
  itemCount: number;
  createdAt: string;
};

export default function OrdersPage() {
  const local = useSyncExternalStore(subscribeLocalOrderLinks, getLocalOrderLinks, getServerLocalOrderLinks);
  const [remote, setRemote] = useState<MyOrder[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/order-requests/mine", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json: { data?: MyOrder[] }) => {
        if (!cancelled) setRemote(Array.isArray(json.data) ? json.data : []);
      })
      .catch(() => !cancelled && setRemote([]));
    return () => {
      cancelled = true;
    };
  }, []);

  // Orders tied to the account (from the ERP) plus guest orders made on this
  // device before logging in. Device-only entries show no live status here;
  // their tracking page fetches it.
  const orders = useMemo<MyOrder[]>(() => {
    const byToken = new Map<string, MyOrder>();
    for (const o of remote ?? []) byToken.set(o.trackingToken, o);
    for (const l of local) {
      if (!byToken.has(l.token)) {
        byToken.set(l.token, {
          code: l.code,
          trackingToken: l.token,
          status: null,
          total: l.estimateTotal,
          itemCount: l.itemCount,
          createdAt: l.createdAt,
        });
      }
    }
    return [...byToken.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [remote, local]);

  return (
    <>
      <PageHeader
        eyebrow="Pesanan"
        title="Pesanan saya"
        description="Semua titipan dari akunmu dan dari perangkat ini. Klik untuk lihat status & rincian."
        actions={
          <Button asChild variant="primary">
            <Link href="/request">
              Titip barang <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      {remote === null && orders.length === 0 ? (
        <GlassCard className="p-10 flex items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Memuat pesanan…
        </GlassCard>
      ) : orders.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-[hsl(var(--muted-foreground))]" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Belum ada pesanan</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Titip barang dari katalog atau lewat form request. Statusnya akan muncul di sini.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild variant="primary">
              <Link href="/katalog">Lihat katalog</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/request">Titip barang apa saja</Link>
            </Button>
          </div>
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.trackingToken}>
              <Link href={`/track/${o.trackingToken}`} className="block">
                <GlassCard className="p-5 flex flex-wrap items-center gap-3 hover:ring-2 hover:ring-[hsl(var(--sage-500)/0.3)] transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-medium">{o.code}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatDate(o.createdAt)} · {o.itemCount} barang
                    </p>
                  </div>
                  {o.status ? (
                    <Badge variant={STATUS_BADGE[o.status]}>{ORDER_STEP_LABEL[o.status]}</Badge>
                  ) : (
                    <Badge variant="neutral">Lihat status</Badge>
                  )}
                  {o.total != null && <span className="tabular-nums font-medium">{formatIDR(o.total)}</span>}
                  <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" aria-hidden />
                </GlassCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
