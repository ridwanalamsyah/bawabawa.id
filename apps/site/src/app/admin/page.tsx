import Link from "next/link";
import { ArrowRight, Inbox, MessageCircle, Package, Plane, Star, Truck, Wallet, Heart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { callErpAsAdmin } from "@/lib/admin-bff";
import { erpSafe } from "@/lib/erp-client";
import { formatDate, formatIDR } from "@/lib/utils";
import { ORDER_STEP_LABEL, STATUS_BADGE, type OrderRequestStatus } from "@/lib/order-requests";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  code: string;
  status: OrderRequestStatus;
  customerName: string;
  createdAt: string;
  quote?: { total: number } | null;
  estimate?: { total: number } | null;
};
type OrderList = { items: OrderRow[]; counts: Partial<Record<OrderRequestStatus, number>> };
type Trip = { id: string; code: string; departAt: string; capacityKg: number; bookedKg: number; status: string; poClosesAt?: string | null };

const TODO: Array<{ status: OrderRequestStatus; label: string; hint: string; icon: typeof Inbox; tone: string }> = [
  { status: "submitted", label: "Perlu dicek", hint: "Cek harga lalu kirim penawaran", icon: Inbox, tone: "bg-[hsl(var(--coral-100))] text-[hsl(var(--coral-600))]" },
  { status: "approved", label: "Menunggu bayar", hint: "Cocokkan transfer yang masuk", icon: Wallet, tone: "bg-[hsl(var(--amber-100))] text-[hsl(var(--amber-600))]" },
  { status: "paid", label: "Siap dibelikan", hint: "Sudah bayar, tinggal belanja", icon: Package, tone: "bg-[hsl(var(--sky-100))] text-[hsl(var(--sky-600))]" },
  { status: "packed", label: "Siap kirim", hint: "Serahkan ke kurir & isi resi", icon: Truck, tone: "bg-[hsl(var(--sage-100))] text-[hsl(var(--sage-700))] dark:bg-[hsl(var(--sage-700)/0.3)] dark:text-[hsl(var(--sage-200))]" },
];

export default async function AdminHomePage() {
  const [orders, reviews, partners, trips] = await Promise.all([
    callErpAsAdmin<OrderList>({ path: "/admin/orders/requests?limit=6" }),
    callErpAsAdmin<Array<{ isPublished: boolean }>>({ path: "/admin/reviews" }),
    callErpAsAdmin<Array<{ status: string }>>({ path: "/admin/partner-inquiries" }),
    erpSafe<Trip[]>({ path: "/trips", timeoutMs: 4000 }),
  ]);
  const counts = orders.ok ? orders.data.counts ?? {} : {};
  const recent = orders.ok ? orders.data.items ?? [] : [];
  const pendingReviews = reviews.ok && Array.isArray(reviews.data) ? reviews.data.filter((r) => !r.isPublished).length : 0;
  const newPartners = partners.ok && Array.isArray(partners.data) ? partners.data.filter((p) => p.status === "new").length : 0;
  const nextTrip = (trips.ok && Array.isArray(trips.data) ? trips.data : [])
    .filter((t) => t.status === "open" || t.status === "fullbooked")
    .sort((a, b) => a.departAt.localeCompare(b.departAt))[0];

  return (
    <>
      <PageHeader title="Halo! Ini yang perlu dikerjakan hari ini" description="Klik kotak untuk langsung membuka antreannya." />

      {!orders.ok && (
        <GlassCard className="mb-4 p-4 text-sm text-[hsl(var(--rose-700))]">
          Data pesanan belum bisa dimuat. Coba muat ulang halaman sebentar lagi.
        </GlassCard>
      )}

      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TODO.map(({ status, label, hint, icon: Icon, tone }) => {
          const n = counts[status] ?? 0;
          return (
            <li key={status}>
              <Link href={`/admin/orders?antrean=${status}`} className="lift flex h-full flex-col gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-3xl font-bold tabular-nums">{n}</span>
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-xs text-[hsl(var(--muted-foreground))]">{hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <GlassCard className="lg:col-span-7 p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
            <h2 className="font-semibold">Pesanan terbaru</h2>
            <Link href="/admin/orders?antrean=all" className="nudge text-sm font-medium underline underline-offset-4">
              Semua pesanan <ArrowRight className="inline h-4 w-4" aria-hidden />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="p-6 text-sm text-[hsl(var(--muted-foreground))]">
              Belum ada pesanan. Bagikan link bawabawa.id/request ke calon pelanggan.
            </p>
          ) : (
            <ul className="divide-y divide-[hsl(var(--border))]">
              {recent.map((o) => {
                const total = o.quote?.total ?? o.estimate?.total;
                return (
                  <li key={o.id}>
                    <Link href={`/admin/orders?antrean=${o.status}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[hsl(var(--surface-2)/0.6)]">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{o.customerName}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {o.code} · {formatDate(o.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {typeof total === "number" && <span className="text-sm tabular-nums">{formatIDR(total)}</span>}
                      <Badge variant={STATUS_BADGE[o.status]}>{ORDER_STEP_LABEL[o.status]}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        <div className="lg:col-span-5 space-y-4">
          <GlassCard className="p-5">
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-[hsl(var(--sky-600))]" aria-hidden />
              <h2 className="font-semibold">Open Trip berikutnya</h2>
            </div>
            {nextTrip ? (
              <div className="mt-3 text-sm">
                <p className="text-lg font-semibold">{formatDate(nextTrip.departAt, { weekday: "long", day: "numeric", month: "long" })}</p>
                <p className="text-[hsl(var(--muted-foreground))]">
                  Terisi {nextTrip.bookedKg} dari {nextTrip.capacityKg} kg
                  {nextTrip.poClosesAt ? ` · PO tutup ${formatDate(nextTrip.poClosesAt, { day: "numeric", month: "short" })}` : ""}
                </p>
                <div className="mt-3 h-2 rounded-full bg-[hsl(var(--surface-2))] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[hsl(var(--sky-500))]"
                    style={{ width: `${Math.min(100, Math.round((nextTrip.bookedKg / Math.max(1, nextTrip.capacityKg)) * 100))}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                Belum ada jadwal.{" "}
                <Link href="/admin/trips" className="underline underline-offset-4">Buat jadwal Open Trip</Link>
              </p>
            )}
          </GlassCard>

          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold">Lainnya</h2>
            <Link href="/admin/reviews" className="flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-[hsl(var(--surface-2)/0.6)]">
              <Star className="h-4 w-4 text-[hsl(var(--amber-600))]" aria-hidden />
              <span className="flex-1 text-sm">Ulasan menunggu disetujui</span>
              <Badge variant={pendingReviews ? "warning" : "neutral"}>{pendingReviews}</Badge>
            </Link>
            <Link href="/admin/partners" className="flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-[hsl(var(--surface-2)/0.6)]">
              <Heart className="h-4 w-4 text-[hsl(var(--coral-600))]" aria-hidden />
              <span className="flex-1 text-sm">Pendaftar reseller baru</span>
              <Badge variant={newPartners ? "warning" : "neutral"}>{newPartners}</Badge>
            </Link>
            <Link href="/admin/orders?antrean=quoted" className="flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-[hsl(var(--surface-2)/0.6)]">
              <MessageCircle className="h-4 w-4 text-[hsl(var(--sky-600))]" aria-hidden />
              <span className="flex-1 text-sm">Penawaran belum dijawab pelanggan</span>
              <Badge variant="neutral">{counts.quoted ?? 0}</Badge>
            </Link>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
