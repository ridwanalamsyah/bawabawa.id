import { PageHeader } from "@/components/dashboard/page-header";
import { Card, GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orders } from "@/lib/mock/orders";
import { formatIDR, formatDate } from "@/lib/utils";

export default function AdminPaymentsPage() {
  return (
    <>
      <PageHeader eyebrow="Pembayaran" title="Pembayaran & rekonsiliasi" description="Approve pembayaran masuk dan pastikan rekonsiliasi ERP." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Saldo escrow</p>
          <p className="mt-1 text-2xl font-semibold">{formatIDR(238_400_000)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Menunggu approval</p>
          <p className="mt-1 text-2xl font-semibold">3</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Released hari ini</p>
          <p className="mt-1 text-2xl font-semibold">{formatIDR(46_840_000)}</p>
        </GlassCard>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface-2))]">
              <tr>
                <Th>Invoice</Th>
                <Th>Customer</Th>
                <Th>Method</Th>
                <Th>Status</Th>
                <Th>Tanggal</Th>
                <Th className="text-right">Total</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => (
                <tr key={o.id} className="border-t border-[hsl(var(--border))]">
                  <Td><span className="font-mono">{o.invoiceId ?? "—"}</span></Td>
                  <Td>{o.customer.name}</Td>
                  <Td>{["QRIS", "Transfer BCA", "ShopeePay", "OVO", "Mandiri"][idx % 5]}</Td>
                  <Td><Badge variant={o.paid ? "success" : "warning"}>{o.paid ? "Paid" : "Pending"}</Badge></Td>
                  <Td className="text-[hsl(var(--muted-foreground))]">{formatDate(o.createdAt)}</Td>
                  <Td className="text-right tabular-nums font-medium">{formatIDR(o.total)}</Td>
                  <Td>{o.paid ? <Button size="sm" variant="ghost">Detail</Button> : <Button size="sm" variant="primary">Approve</Button>}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={"text-left font-medium px-5 py-3 " + (className ?? "")}>{children}</th>;
}
function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={"px-5 py-3 " + (className ?? "")}>{children}</td>;
}
