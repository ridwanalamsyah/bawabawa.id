import Link from "next/link";
import { ArrowRight, Package, Wallet, Truck, Heart, ShoppingBag, Plane } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrackingTimeline } from "@/components/dashboard/tracking-timeline";
import { orders, ORDER_STATUS_LABEL } from "@/lib/mock/orders";
import { trips } from "@/lib/mock/trips";
import { formatIDR, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const liveOrder = orders.find((o) => o.status === "in_transit") ?? orders[0];
  const recent = orders.slice(0, 4);
  const upcomingTrip = trips.find((t) => t.status !== "in_transit") ?? trips[0];
  return (
    <>
      <PageHeader
        eyebrow="Beranda"
        title="Halo, Aulia 👋"
        description="Pantau titipanmu dari Bandung dan jadwal trip berikutnya di sini."
        actions={
          <Button asChild variant="primary">
            <Link href="/request">
              Buat request <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Package} label="Pesanan aktif" value="3" delta="+1" trend="up" />
        <StatCard icon={Truck} label="Sedang dalam perjalanan" value="1" delta="0" trend="up" tone="from-[hsl(var(--olive-300))] to-[hsl(var(--olive-700))]" />
        <StatCard icon={Wallet} label="Total titipan bulan ini" value={formatIDR(2_360_000)} delta="+18%" trend="up" tone="from-[hsl(var(--emerald-400))] to-[hsl(var(--emerald-600))]" />
        <StatCard icon={Heart} label="Item di wishlist" value="12" tone="from-[hsl(var(--sage-400))] to-[hsl(var(--olive-700))]" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <GlassCard className="lg:col-span-7 p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
                Live Tracking
              </p>
              <h3 className="mt-1 font-semibold flex items-center gap-2">
                {liveOrder.code}
                <Badge variant="info">{ORDER_STATUS_LABEL[liveOrder.status]}</Badge>
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {liveOrder.items.length} item · estimasi tiba {formatDate(trips[0].arriveEstimateAt)}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/orders/${liveOrder.id}`}>
                Detail <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <TrackingTimeline order={liveOrder} />
        </GlassCard>

        <div className="lg:col-span-5 grid gap-4">
          <GlassCard className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Trip berikutnya
            </p>
            <h3 className="mt-1 font-semibold">{upcomingTrip.origin} → {upcomingTrip.destination}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {upcomingTrip.code} · {formatDate(upcomingTrip.departAt, { weekday: "long", day: "numeric", month: "short" })}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <Mini label="Slot tersisa" value={`${Math.max(0, upcomingTrip.capacityKg - upcomingTrip.bookedKg)} kg`} />
              <Mini label="Estimasi tiba" value={formatDate(upcomingTrip.arriveEstimateAt, { day: "numeric", month: "short" })} />
              <Mini label="Personal shopper" value={upcomingTrip.shopper.name.split(" ")[0]} />
            </div>
            <Button asChild className="mt-5 w-full" variant="primary">
              <Link href={`/request?trip=${upcomingTrip.id}`}>
                <Plane className="h-4 w-4" /> Pesan slot trip ini
              </Link>
            </Button>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Tip hari ini
            </p>
            <p className="mt-2 text-sm">
              <span className="font-semibold">Pasar Baru</span> menyediakan banyak grosir hijab & batik dengan
              harga lebih murah. Tambahkan kategori <span className="font-semibold">Hijab</span> di request
              kamu agar shopper otomatis mengarah ke sana.
            </p>
          </GlassCard>
        </div>
      </div>

      <div className="mt-6">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
                Pesanan terbaru
              </p>
              <h3 className="mt-1 font-semibold">Riwayat pesanan kamu</h3>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/orders">
                Lihat semua <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface-2))]">
                <tr>
                  <Th>Kode</Th>
                  <Th>Item</Th>
                  <Th>Status</Th>
                  <Th>Tanggal</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-2))]">
                    <Td>
                      <Link href={`/dashboard/orders/${o.id}`} className="font-mono font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                        {o.code}
                      </Link>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                        <span className="truncate max-w-[18rem]">
                          {o.items.map((i) => i.name).join(", ")}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <Badge variant={o.status === "delivered" ? "success" : o.status === "in_transit" ? "info" : "default"}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </Badge>
                    </Td>
                    <Td className="text-[hsl(var(--muted-foreground))]">{formatDate(o.createdAt)}</Td>
                    <Td className="text-right tabular-nums font-medium">{formatIDR(o.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[hsl(var(--surface-2))] p-2.5">
      <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{label}</p>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={"text-left font-medium px-5 py-3 " + (className ?? "")}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-5 py-3 " + (className ?? "")}>{children}</td>;
}
