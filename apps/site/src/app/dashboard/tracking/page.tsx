import Link from "next/link";
import { Plane, Truck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { TrackingTimeline } from "@/components/dashboard/tracking-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orders, ORDER_STATUS_LABEL } from "@/lib/mock/orders";

export default function LiveTrackingPage() {
  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  return (
    <>
      <PageHeader
        eyebrow="Live Tracking"
        title="Pantau semua titipan aktif"
        description="Updates streamed via WebSocket — status berubah otomatis tanpa refresh."
      />
      {active.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Tidak ada titipan aktif saat ini.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {active.map((o) => (
            <GlassCard key={o.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">{o.code}</p>
                  <p className="font-semibold mt-1">
                    {o.items.length} item · {o.items[0].category}
                  </p>
                </div>
                <Badge variant="info">
                  {o.status === "in_transit" ? (
                    <Plane className="h-3 w-3" />
                  ) : (
                    <Truck className="h-3 w-3" />
                  )}
                  {ORDER_STATUS_LABEL[o.status]}
                </Badge>
              </div>
              <TrackingTimeline order={o} />
              <div className="mt-5 flex justify-end">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/orders/${o.id}`}>Detail order</Link>
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
