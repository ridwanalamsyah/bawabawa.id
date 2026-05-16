"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getLocalOrderListSnapshot,
  subscribeLocalOrders,
  type LocalOrder,
} from "@/lib/local-orders";
import { formatIDR, formatDate } from "@/lib/utils";
import { TIERS } from "@/lib/pricing";

const STATUS_LABEL: Record<LocalOrder["status"], string> = {
  pending_payment: "Menunggu pembayaran",
  shopping: "Dibelanjakan",
  packed: "Dikemas",
  in_transit: "Dalam perjalanan",
  delivered: "Diterima",
  cancelled: "Dibatalkan",
};

const EMPTY_LIST: LocalOrder[] = [];

export default function OrdersPage() {
  const orders = useSyncExternalStore<LocalOrder[]>(
    subscribeLocalOrders,
    getLocalOrderListSnapshot,
    () => EMPTY_LIST,
  );

  return (
    <>
      <PageHeader
        eyebrow="Pesanan"
        title="Semua titipan kamu"
        description="Pesanan yang dibuat dari perangkat ini muncul di sini. Begitu data ERP terhubung, riwayat lengkap akan ditampilkan otomatis."
        actions={
          <Button asChild variant="primary">
            <Link href="/request">
              Buat request <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {orders.length === 0 && (
        <GlassCard className="p-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[hsl(var(--surface-2))] grid place-items-center text-[hsl(var(--muted-foreground))]">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Belum ada pesanan</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Buat request pertama kamu — pesanan akan disimpan secara lokal dan
            dapat dipantau lewat halaman tracking, atau muncul di sini ketika
            akun kamu sinkron dengan ERP.
          </p>
          <Button asChild variant="primary" className="mt-6">
            <Link href="/request">
              Buat request pertama <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </GlassCard>
      )}

      {orders.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--surface-2))]">
                <tr>
                  <Th>Kode</Th>
                  <Th>Item</Th>
                  <Th>Status</Th>
                  <Th>Layanan</Th>
                  <Th>Tanggal</Th>
                  <Th className="text-right">Total</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.token} className="border-t border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-2))]">
                    <Td>
                      <span className="font-mono font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
                        {o.code}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 min-w-0">
                        <ShoppingBag className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] shrink-0" />
                        <span className="truncate max-w-[20rem]">
                          {o.items.map((i) => i.name).filter(Boolean).join(", ") || "—"}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <Badge variant={o.status === "delivered" ? "success" : "info"}>
                        {STATUS_LABEL[o.status]}
                      </Badge>
                    </Td>
                    <Td className="text-xs text-[hsl(var(--muted-foreground))]">{TIERS[o.tier].label}</Td>
                    <Td className="text-[hsl(var(--muted-foreground))]">{formatDate(o.createdAt)}</Td>
                    <Td className="text-right tabular-nums font-medium">{formatIDR(o.pricing.total)}</Td>
                    <Td>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/track/${o.token}`}>
                          Lacak <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={"text-left font-medium px-5 py-3 " + (className ?? "")}>{children}</th>;
}
function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={"px-5 py-3 " + (className ?? "")}>{children}</td>;
}
