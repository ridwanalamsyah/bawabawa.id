import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Receipt, Package, MapPin } from "lucide-react";
import { orders, ORDER_STATUS_LABEL } from "@/lib/mock/orders";
import { Card, GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrackingTimeline } from "@/components/dashboard/tracking-timeline";
import { formatIDR, formatDate } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <Button asChild variant="ghost">
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Receipt className="h-4 w-4" /> Invoice
          </Button>
          <Button variant="primary" size="sm">
            <MessageSquare className="h-4 w-4" /> Chat shopper
          </Button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">{order.code}</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
            Pesanan {order.items.length} item
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Dibuat {formatDate(order.createdAt, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Badge variant={order.status === "delivered" ? "success" : order.status === "in_transit" ? "info" : "default"}>
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <GlassCard className="lg:col-span-7 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] mb-4">
            Tracking realtime
          </p>
          <TrackingTimeline order={order} />
        </GlassCard>

        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] flex items-center gap-2">
              <Package className="h-3.5 w-3.5" /> Item
            </p>
            <ul className="mt-3 space-y-3">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{it.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {it.category} · qty {it.qty}
                    </p>
                  </div>
                  <p className="tabular-nums">{formatIDR(((it.estPriceMin + it.estPriceMax) / 2) * it.qty)}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] flex items-center gap-2">
              <Receipt className="h-3.5 w-3.5" /> Rincian biaya
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <Row label="Subtotal item" value={formatIDR(order.itemsTotalEst)} />
              <Row label="Fee jasa titip" value={formatIDR(order.jastipFee)} />
              <Row label="Ongkir lokal Samarinda" value={formatIDR(order.localShipping)} />
              <li className="h-px bg-[hsl(var(--border))] my-2" />
              <Row label="Total" value={formatIDR(order.total)} bold />
              <li className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">
                {order.paid ? `Lunas via QRIS · ${order.invoiceId}` : "Menunggu pembayaran"}
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> Alamat penerima
            </p>
            <p className="mt-3 font-medium">{order.destAddress.name}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{order.destAddress.phone}</p>
            <p className="mt-2 text-sm">{order.destAddress.address}, {order.destAddress.city} {order.destAddress.postal}</p>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className={bold ? "font-semibold" : "text-[hsl(var(--muted-foreground))]"}>{label}</span>
      <span className={"tabular-nums " + (bold ? "font-semibold" : "")}>{value}</span>
    </li>
  );
}
