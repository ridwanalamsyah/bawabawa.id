import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { MiniAreaChart, MiniDonut } from "@/components/dashboard/area-chart";
import { revenueLast14Days, ordersByCategory } from "@/lib/mock/analytics";
import { Badge } from "@/components/ui/badge";

export default function AdminReportsPage() {
  return (
    <>
      <PageHeader eyebrow="Analytics" title="Laporan & analytics" description="Insight bisnis realtime — revenue, kategori, retention." />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <GlassCard className="lg:col-span-8 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Revenue trend
            </p>
            <Badge variant="success">+24% MoM</Badge>
          </div>
          <MiniAreaChart data={revenueLast14Days} height={220} />
        </GlassCard>
        <GlassCard className="lg:col-span-4 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] mb-3">
            Distribusi kategori
          </p>
          <MiniDonut data={ordersByCategory} />
        </GlassCard>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: "Conversion rate landing → request", value: "12.4%", delta: "+1.2pp" },
          { label: "Retention 30 hari", value: "68.1%", delta: "+3.4pp" },
          { label: "AOV (Average Order Value)", value: "Rp 638rb", delta: "+9%" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-5">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              <Badge variant="success">{s.delta}</Badge>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
