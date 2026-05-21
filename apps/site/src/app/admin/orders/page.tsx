import Link from "next/link";
import { Search, Filter, Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orders, ORDER_STATUS_LABEL } from "@/lib/mock/orders";
import { formatIDR, formatDate } from "@/lib/utils";

export default function AdminOrdersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Manajemen pesanan"
        description="Kelola semua titipan, approve perubahan harga, dan assign personal shopper."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="primary">
              <Link href="/admin/pos">
                <Plus className="h-4 w-4" /> Order manual (IG/WA)
              </Link>
            </Button>
            <Button variant="outline"><Download className="h-4 w-4" /> Export CSV</Button>
          </div>
        }
      />
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input placeholder="Cari kode, customer, atau item..." className="pl-10" />
        </div>
        <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 text-sm hover:bg-[hsl(var(--surface-2))]">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface-2))]">
              <tr>
                <Th>Kode</Th>
                <Th>Customer</Th>
                <Th>Trip</Th>
                <Th>Status</Th>
                <Th>Pembayaran</Th>
                <Th>Tanggal</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-2))]">
                  <Td>
                    <Link href={`/dashboard/orders/${o.id}`} className="font-mono font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                      {o.code}
                    </Link>
                  </Td>
                  <Td>
                    <p className="font-medium">{o.customer.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{o.customer.city}</p>
                  </Td>
                  <Td className="font-mono text-xs">{o.tripId ?? "—"}</Td>
                  <Td>
                    <Badge variant={o.status === "delivered" ? "success" : o.status === "in_transit" ? "info" : "default"}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={o.paid ? "success" : "warning"}>{o.paid ? "Lunas" : "Pending"}</Badge>
                  </Td>
                  <Td className="text-[hsl(var(--muted-foreground))]">{formatDate(o.createdAt)}</Td>
                  <Td className="text-right tabular-nums font-medium">{formatIDR(o.total)}</Td>
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
