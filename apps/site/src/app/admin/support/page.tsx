import { PageHeader } from "@/components/dashboard/page-header";
import { Card, GlassCard } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { customers } from "@/lib/mock/customers";

const TICKETS = [
  { id: "T-1024", subject: "Barang belum sampai padahal sudah out for delivery", priority: "high" as const, channel: "WhatsApp", customer: customers[0] },
  { id: "T-1023", subject: "Mau cancel request — barang ternyata habis", priority: "medium" as const, channel: "Live Chat", customer: customers[1] },
  { id: "T-1022", subject: "Tanya tarif untuk titip 2 koper", priority: "low" as const, channel: "Live Chat", customer: customers[4] },
  { id: "T-1021", subject: "Update alamat penerima setelah order", priority: "medium" as const, channel: "Email", customer: customers[3] },
];

export default function AdminSupportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Customer Support"
        title="Tiket support"
        description="SLA tracking, prioritas, dan integrasi WhatsApp/Live Chat."
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-8 p-0 overflow-hidden">
          <div className="p-5 border-b border-[hsl(var(--border))] flex items-center gap-2">
            <p className="font-semibold">Open tickets</p>
            <Badge variant="warning">{TICKETS.length}</Badge>
          </div>
          <ul className="divide-y divide-[hsl(var(--border))]">
            {TICKETS.map((t) => (
              <li key={t.id} className="p-4 flex items-start gap-3">
                <Avatar name={t.customer.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">{t.id}</span>
                    <Badge variant={t.priority === "high" ? "danger" : t.priority === "medium" ? "warning" : "neutral"}>
                      {t.priority}
                    </Badge>
                    <Badge variant="info">{t.channel}</Badge>
                  </div>
                  <p className="mt-1 font-medium truncate">{t.subject}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.customer.name} · {t.customer.city}</p>
                </div>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">12m lalu</span>
              </li>
            ))}
          </ul>
        </Card>
        <GlassCard className="lg:col-span-4 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            SLA snapshot
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span>First response avg</span><span className="font-semibold">4 menit</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Resolution avg</span><span className="font-semibold">2 jam 14 menit</span>
            </li>
            <li className="flex items-center justify-between">
              <span>CSAT minggu ini</span><span className="font-semibold">96%</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Tiket di luar SLA</span><span className="font-semibold text-[hsl(var(--warning))]">2</span>
            </li>
          </ul>
        </GlassCard>
      </div>
    </>
  );
}
