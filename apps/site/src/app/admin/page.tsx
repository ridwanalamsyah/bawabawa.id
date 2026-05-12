import Link from "next/link";
import {
  TrendingUp,
  Package,
  Plane,
  Users,
  Activity,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { GlassCard, Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MiniAreaChart, MiniDonut } from "@/components/dashboard/area-chart";
import { revenueLast14Days, ordersByCategory, liveActivity, topShoppers, erpSyncEvents } from "@/lib/mock/analytics";
import { orders, ORDER_STATUS_LABEL } from "@/lib/mock/orders";
import { trips } from "@/lib/mock/trips";
import { formatIDR, formatDate } from "@/lib/utils";

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Operations dashboard"
        description="Realtime metric, sinkronisasi ERP, dan monitoring pengiriman aktif."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="success">
              <Activity className="h-3 w-3" /> ERP synced
            </Badge>
            <Button variant="outline" size="sm">Export</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={TrendingUp} label="Revenue bulan ini" value={formatIDR(1_842_000_000)} delta="+24%" trend="up" />
        <StatCard icon={Package} label="Pesanan aktif" value="137" delta="+8%" trend="up" tone="from-[hsl(var(--olive-300))] to-[hsl(var(--olive-700))]" />
        <StatCard icon={Plane} label="Trip berjalan" value="4" delta="+1" trend="up" tone="from-[hsl(var(--emerald-400))] to-[hsl(var(--emerald-600))]" />
        <StatCard icon={Users} label="Customer aktif" value="12.483" delta="+342" trend="up" tone="from-[hsl(var(--sage-400))] to-[hsl(var(--olive-700))]" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <GlassCard className="lg:col-span-8 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
                Revenue 14 hari terakhir
              </p>
              <h3 className="mt-1 text-2xl font-semibold tabular-nums">{formatIDR(143_220_000)}</h3>
            </div>
            <Badge variant="success">+18% MoM</Badge>
          </div>
          <MiniAreaChart data={revenueLast14Days} />
        </GlassCard>

        <GlassCard className="lg:col-span-4 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Kategori barang terlaris
          </p>
          <h3 className="mt-1 font-semibold mb-4">Distribusi pesanan</h3>
          <MiniDonut data={ordersByCategory} />
        </GlassCard>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7 p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
                Pesanan terbaru
              </p>
              <h3 className="mt-1 font-semibold">Live order feed</h3>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/orders">Semua <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface-2))]">
                <tr>
                  <Th>Kode</Th>
                  <Th>Customer</Th>
                  <Th>Status</Th>
                  <Th>Trip</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-t border-[hsl(var(--border))]">
                    <Td><span className="font-mono font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">{o.code}</span></Td>
                    <Td>{o.customer.name}</Td>
                    <Td>
                      <Badge variant={o.status === "delivered" ? "success" : o.status === "in_transit" ? "info" : "default"}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </Badge>
                    </Td>
                    <Td className="font-mono text-xs text-[hsl(var(--muted-foreground))]">{o.tripId ?? "—"}</Td>
                    <Td className="text-right tabular-nums">{formatIDR(o.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <GlassCard className="lg:col-span-5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Live activity
          </p>
          <h3 className="mt-1 font-semibold flex items-center gap-2">
            Aktivitas live
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-[hsl(var(--emerald-500))] opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--emerald-500))]" />
            </span>
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            {liveActivity.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--sage-700))]" />
                <div className="flex-1">
                  <p>{a.text}</p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{a.at}</p>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-6 p-0 overflow-hidden">
          <div className="p-5 border-b border-[hsl(var(--border))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Trip aktif
            </p>
            <h3 className="mt-1 font-semibold">Monitoring pengiriman</h3>
          </div>
          <ul className="divide-y divide-[hsl(var(--border))]">
            {trips.slice(0, 4).map((t) => {
              const filled = Math.round((t.bookedKg / t.capacityKg) * 100);
              return (
                <li key={t.id} className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-[hsl(var(--sage-100))] dark:bg-[hsl(var(--sage-700)/0.4)] grid place-items-center text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                    <Plane className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs">{t.code}</p>
                      <Badge
                        variant={
                          t.status === "in_transit"
                            ? "info"
                            : t.status === "fullbooked"
                            ? "warning"
                            : "success"
                        }
                      >
                        {t.status === "in_transit" ? "in-transit" : t.status === "fullbooked" ? "full" : "open"}
                      </Badge>
                    </div>
                    <p className="text-sm truncate">{formatDate(t.departAt, { weekday: "short", day: "numeric", month: "short" })} · {t.shopper.name}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-medium">{filled}%</p>
                    <p className="text-[hsl(var(--muted-foreground))]">{t.bookedKg}/{t.capacityKg} kg</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <GlassCard className="lg:col-span-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
                ERP sync stream
              </p>
              <h3 className="mt-1 font-semibold">Realtime webhook log</h3>
            </div>
            <Badge variant="success"><Activity className="h-3 w-3" /> Live</Badge>
          </div>
          <ul className="space-y-2 text-sm">
            {erpSyncEvents.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] px-3 py-2">
                <span className="font-mono text-xs text-[hsl(var(--muted-foreground))] w-16 shrink-0">{e.at}</span>
                <span className="font-mono text-xs text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">{e.type}</span>
                <span className="font-mono text-xs text-[hsl(var(--muted-foreground))] truncate">{e.entity}</span>
                <Badge variant={e.status === "ok" ? "success" : "warning"} className="ml-auto">
                  {e.status === "ok" ? "synced" : "retrying"}
                </Badge>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Top personal shopper
          </p>
          <h3 className="mt-1 font-semibold">Performance shopper minggu ini</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {topShoppers.map((s, i) => (
              <li key={s.name} className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full bg-linear-to-br from-[hsl(var(--sage-300))] to-[hsl(var(--sage-700))] grid place-items-center text-white text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="flex-1 font-medium">{s.name}</span>
                <span className="text-[hsl(var(--muted-foreground))]">{s.trips} trip</span>
                <span className="font-medium text-[hsl(var(--warning))]">★ {s.rating}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Perlu perhatian
            </p>
            <Badge variant="warning">3 issue</Badge>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { t: "1 webhook ERP retry — customer.upsert c-3", level: "warning" },
              { t: "Trip BDG-SMD-243 fullbooked — pertimbangkan tambah trip", level: "info" },
              { t: "3 invoice perlu approval finance", level: "warning" },
              { t: "Wallet escrow > Rp 200jt — siap settle", level: "info" },
            ].map((it, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] p-3">
                <AlertCircle className={"h-4 w-4 " + (it.level === "warning" ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--sage-700))]")} />
                <span>{it.t}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={"text-left font-medium px-5 py-3 " + (className ?? "")}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-5 py-3 " + (className ?? "")}>{children}</td>;
}
