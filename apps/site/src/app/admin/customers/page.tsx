import { PageHeader } from "@/components/dashboard/page-header";
import { Card, GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { customers } from "@/lib/mock/customers";
import { formatIDR, formatDate } from "@/lib/utils";

export default function AdminCustomersPage() {
  return (
    <>
      <PageHeader eyebrow="Customer" title="Customer management" description="Lihat profil customer, riwayat transaksi, dan segmentasi loyalty." />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Total customer</p>
          <p className="mt-1 text-2xl font-semibold">{customers.length.toLocaleString("id-ID")}+</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">VIP</p>
          <p className="mt-1 text-2xl font-semibold">{customers.filter(c=>c.status==="vip").length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Customer baru bulan ini</p>
          <p className="mt-1 text-2xl font-semibold">342</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Avg LTV</p>
          <p className="mt-1 text-2xl font-semibold">{formatIDR(2_180_000)}</p>
        </GlassCard>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface-2))]">
              <tr>
                <Th>Customer</Th>
                <Th>Kontak</Th>
                <Th>Kota</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th className="text-right">Total order</Th>
                <Th className="text-right">LTV</Th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-[hsl(var(--border))]">
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size={32} />
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{c.id}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <p>{c.email}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.phone}</p>
                  </Td>
                  <Td>{c.city}</Td>
                  <Td className="text-[hsl(var(--muted-foreground))]">{formatDate(c.joinedAt)}</Td>
                  <Td>
                    <Badge variant={c.status === "vip" ? "success" : c.status === "active" ? "neutral" : "warning"}>
                      {c.status}
                    </Badge>
                  </Td>
                  <Td className="text-right tabular-nums">{c.totalOrders}</Td>
                  <Td className="text-right tabular-nums font-medium">{formatIDR(c.totalSpent)}</Td>
                </tr>
              ))}
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
