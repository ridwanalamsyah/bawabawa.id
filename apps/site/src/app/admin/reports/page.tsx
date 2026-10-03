import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { callErpAsCustomer } from "@/lib/customer-bff";
import { ORDER_FLOW, ORDER_STEP_LABEL } from "@/lib/order-requests";

// Previously rendered hardcoded revenue charts. Now: real counts per status
// from the order-request queue, plus a CSV export of real orders.
export default async function AdminReportsPage() {
  const data = await callErpAsCustomer<{ counts: Record<string, number> }>({ path: "/admin/orders/requests?limit=1" });
  const counts = data?.counts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <>
      <PageHeader
        title="Laporan"
        description="Angka langsung dari database. Untuk analisis lanjut, unduh CSV dan buka di Excel / Google Sheets."
        actions={
          <Button asChild variant="outline">
            <a href="/api/admin/reports">
              <Download className="h-4 w-4" aria-hidden /> Unduh CSV pesanan
            </a>
          </Button>
        }
      />
      {data === null ? (
        <GlassCard className="p-6 text-sm text-[hsl(var(--muted-foreground))]">
          Data belum bisa dimuat (sesi kedaluwarsa atau server tidak terjangkau). Muat ulang halaman.
        </GlassCard>
      ) : (
        <GlassCard className="p-6">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Total pesanan dari situs: <strong className="text-[hsl(var(--foreground))]">{total}</strong></p>
          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...ORDER_FLOW, "cancelled" as const].map((s) => (
              <div key={s} className="rounded-xl border border-[hsl(var(--border))] p-3">
                <dt className="text-xs text-[hsl(var(--muted-foreground))]">{ORDER_STEP_LABEL[s]}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{counts[s] ?? 0}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>
      )}
    </>
  );
}
