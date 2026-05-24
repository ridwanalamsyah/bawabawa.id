import { TrendingUp, Package, Plane, Users, Activity, Inbox } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { GlassCard, Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Numbers degrade to em-dash and tables to empty-state until real orders
// land — that way the dashboard reflects production state, not fake demo
// data. The wiring to live counters is intentionally minimal to stay below
// the fold of the ERP integration; see /admin/trips & /admin/customers for
// the data-driven flows already moved over.
export default function AdminOverviewPage() {
  const stats = {
    revenue: null,
    activeOrders: null,
    activeTrips: null,
    activeCustomers: null,
  };
  const recentOrders: Array<{ id: string; code: string; customer: string; status: string; tripId: string | null; total: number }> = [];
  const activeTrips: Array<{ id: string; code: string; status: string; bookedKg: number; capacityKg: number; shopperName: string; departAt: string }> = [];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Operations dashboard"
        description="Ringkasan operasional Bawabawa. Data ter-update otomatis seiring pesanan masuk."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="default">
              <Activity className="h-3 w-3" /> Belum ada aktivitas
            </Badge>
            <Button variant="outline" size="sm" disabled>Export</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={TrendingUp} label="Revenue bulan ini" value={stats.revenue ?? "—"} delta="—" trend="up" />
        <StatCard icon={Package} label="Pesanan aktif" value={stats.activeOrders ?? "—"} delta="—" trend="up" tone="from-[hsl(var(--olive-300))] to-[hsl(var(--olive-700))]" />
        <StatCard icon={Plane} label="Trip berjalan" value={stats.activeTrips ?? "—"} delta="—" trend="up" tone="from-[hsl(var(--emerald-400))] to-[hsl(var(--emerald-600))]" />
        <StatCard icon={Users} label="Customer aktif" value={stats.activeCustomers ?? "—"} delta="—" trend="up" tone="from-[hsl(var(--sage-400))] to-[hsl(var(--olive-700))]" />
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
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Belum ada pesanan"
              hint="Tabel pesanan terbaru akan muncul di sini begitu ada customer yang checkout dari /request."
            />
          ) : (
            <p className="p-5 text-sm">Order list akan render di sini.</p>
          )}
        </Card>

        <GlassCard className="lg:col-span-5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Aktivitas terbaru
          </p>
          <h3 className="mt-1 font-semibold">Activity feed</h3>
          <EmptyState
            icon={Activity}
            title="Belum ada aktivitas"
            hint="Notifikasi event sistem (login, payment, shipping update) akan muncul di sini."
            compact
          />
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
          {activeTrips.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="Belum ada trip aktif"
              hint="Trip yang sedang berjalan akan tampil di sini. Tambah trip baru di /admin/trips."
            />
          ) : (
            <p className="p-5 text-sm">Trip list akan render di sini.</p>
          )}
        </Card>

        <GlassCard className="lg:col-span-6 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Log otomatisasi
          </p>
          <h3 className="mt-1 font-semibold">Notifikasi & status pengiriman</h3>
          <EmptyState
            icon={Activity}
            title="Belum ada event"
            hint="Status pembayaran dan update kurir akan ter-log di sini."
            compact
          />
        </GlassCard>
      </div>
    </>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  compact?: boolean;
}) {
  return (
    <div className={"flex flex-col items-center justify-center text-center " + (compact ? "px-2 py-8" : "px-6 py-12")}>
      <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--surface-2))] grid place-items-center text-[hsl(var(--muted-foreground))]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] max-w-xs">{hint}</p>
    </div>
  );
}
