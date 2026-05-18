import Link from "next/link";
import { ArrowRight, Package, Wallet, Truck, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { callErpAsCustomer } from "@/lib/customer-bff";
import { formatIDR, formatDate } from "@/lib/utils";

type ErpOrder = {
  id: string;
  code?: string;
  orderNumber?: string;
  status?: string;
  totalAmount?: number | string;
  tier?: string;
  createdAt?: string;
  itemCount?: number;
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Menunggu pembayaran",
  paid: "Dibayar",
  shopping: "Dibelanjakan",
  packed: "Dikemas",
  in_transit: "Dalam perjalanan",
  delivered: "Diterima",
  cancelled: "Dibatalkan",
};

function statusLabel(s: string | undefined) {
  if (!s) return "—";
  return STATUS_LABEL[s] ?? s;
}

function totalToNumber(v: number | string | undefined): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

export default async function DashboardPage() {
  // Customer-scoped order list. The ERP filters /orders/mine to the
  // signed-in customer's rows. Errors return null and the page shows
  // its empty-state instead of crashing.
  const list = await callErpAsCustomer<ErpOrder[]>({ path: "/orders/mine" });
  const orders = Array.isArray(list) ? list : [];

  const active = orders.filter(
    (o) => o.status && o.status !== "delivered" && o.status !== "cancelled",
  );
  const inTransit = orders.filter((o) => o.status === "in_transit");
  const monthSpend = orders.reduce((s, o) => s + totalToNumber(o.totalAmount), 0);
  const liveOrder = active[0] ?? null;
  const recent = orders.slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Beranda"
        title="Pantau titipanmu di sini"
        description="Order kamu di Bawabawa.id tampil real-time. Kalau kosong, buat request pertamamu di bawah."
        actions={
          <Button asChild variant="primary">
            <Link href="/request">
              Buat request <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Package} label="Pesanan aktif" value={String(active.length)} />
        <StatCard
          icon={Truck}
          label="Sedang dalam perjalanan"
          value={String(inTransit.length)}
          tone="from-[hsl(var(--olive-300))] to-[hsl(var(--olive-700))]"
        />
        <StatCard
          icon={Wallet}
          label="Total titipan"
          value={formatIDR(monthSpend)}
          tone="from-[hsl(var(--emerald-400))] to-[hsl(var(--emerald-600))]"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total pesanan"
          value={String(orders.length)}
          tone="from-[hsl(var(--sage-400))] to-[hsl(var(--olive-700))]"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <GlassCard className="lg:col-span-7 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Live tracking
          </p>
          {liveOrder ? (
            <div className="mt-3">
              <h3 className="font-semibold flex items-center gap-2">
                {liveOrder.code ?? liveOrder.orderNumber ?? liveOrder.id}
                <Badge variant="info">{statusLabel(liveOrder.status)}</Badge>
              </h3>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                Dibuat{" "}
                {liveOrder.createdAt
                  ? formatDate(liveOrder.createdAt, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
              <div className="mt-4">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/orders`}>
                    Lihat semua pesanan <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Belum ada pesanan aktif"
              description="Buat request pertamamu lewat halaman Titip Sekarang — kamu bisa pilih Reguler (3–4 hari) atau Kargo (10 hari)."
              actionHref="/request"
              actionLabel="Buat request"
            />
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Riwayat singkat
          </p>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
              Riwayat pesananmu akan muncul di sini.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recent.map((o) => (
                <li
                  key={o.id}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs">
                      {o.code ?? o.orderNumber ?? o.id}
                    </span>
                    <Badge variant={o.status === "delivered" ? "success" : "info"}>
                      {statusLabel(o.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    {o.createdAt ? formatDate(o.createdAt, { day: "numeric", month: "short" }) : ""}
                    {o.totalAmount ? ` · ${formatIDR(totalToNumber(o.totalAmount))}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </>
  );
}

function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
      <div className="mt-4">
        <Button asChild size="sm" variant="primary">
          <Link href={actionHref}>
            {actionLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
