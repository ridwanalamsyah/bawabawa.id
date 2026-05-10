import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trips } from "@/lib/mock/trips";
import { formatIDR, formatDate } from "@/lib/utils";

export default function AdminTripsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Pengaturan jadwal trip"
        description="Buat trip baru, atur kapasitas, fee per kg, dan assign personal shopper."
        actions={<Button variant="primary"><Plus className="h-4 w-4" /> Trip baru</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Trip aktif</p>
          <p className="mt-1 text-2xl font-semibold">{trips.filter((t) => t.status !== "closed").length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Total kapasitas</p>
          <p className="mt-1 text-2xl font-semibold">{trips.reduce((s, t) => s + t.capacityKg, 0)} kg</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Estimasi revenue trip</p>
          <p className="mt-1 text-2xl font-semibold">{formatIDR(trips.reduce((s, t) => s + t.bookedKg * t.perKgFee + t.baseFee, 0))}</p>
        </GlassCard>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface-2))]">
              <tr>
                <Th>Kode</Th>
                <Th>Berangkat</Th>
                <Th>Estimasi tiba</Th>
                <Th>Personal Shopper</Th>
                <Th>Kapasitas</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => {
                const filled = Math.round((t.bookedKg / t.capacityKg) * 100);
                return (
                  <tr key={t.id} className="border-t border-[hsl(var(--border))]">
                    <Td><span className="font-mono text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">{t.code}</span></Td>
                    <Td>{formatDate(t.departAt, { weekday: "short", day: "numeric", month: "short" })}</Td>
                    <Td>{formatDate(t.arriveEstimateAt, { weekday: "short", day: "numeric", month: "short" })}</Td>
                    <Td>{t.shopper.name} <span className="text-[hsl(var(--muted-foreground))]">★ {t.shopper.rating}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Progress value={filled} className="flex-1" />
                        <span className="text-xs text-[hsl(var(--muted-foreground))] w-12 text-right">{t.bookedKg}/{t.capacityKg}kg</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge variant={t.status === "in_transit" ? "info" : t.status === "fullbooked" ? "warning" : "success"}>
                        {t.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={"text-left font-medium px-5 py-3 " + (className ?? "")}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-5 py-3 " + (className ?? "")}>{children}</td>;
}
