import { Download, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { orders } from "@/lib/mock/orders";
import { formatIDR, formatDate } from "@/lib/utils";

export default function InvoicePage() {
  const invoices = orders.filter((o) => o.invoiceId);
  return (
    <>
      <PageHeader
        eyebrow="Invoice"
        title="Riwayat invoice"
        description="Semua invoice tersinkron otomatis dengan ERP keuangan Bawabawa."
      />
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface-2))]">
              <tr>
                <Th>No. Invoice</Th>
                <Th>Pesanan</Th>
                <Th>Tanggal</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((o) => (
                <tr key={o.id} className="border-t border-[hsl(var(--border))]">
                  <Td><span className="font-mono font-medium">{o.invoiceId}</span></Td>
                  <Td className="font-mono text-xs">{o.code}</Td>
                  <Td className="text-[hsl(var(--muted-foreground))]">{formatDate(o.createdAt)}</Td>
                  <Td><Badge variant={o.paid ? "success" : "warning"}>{o.paid ? "Lunas" : "Belum lunas"}</Badge></Td>
                  <Td className="text-right tabular-nums font-medium">{formatIDR(o.total)}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <button className="inline-flex items-center gap-1 hover:text-[hsl(var(--foreground))]"><Download className="h-3.5 w-3.5" /> PDF</button>
                      <button className="inline-flex items-center gap-1 hover:text-[hsl(var(--foreground))]"><ExternalLink className="h-3.5 w-3.5" /> Buka</button>
                    </div>
                  </Td>
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
