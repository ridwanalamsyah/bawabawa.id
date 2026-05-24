"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  PackageCheck,
  Truck,
  CircleCheck,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatIDR } from "@/lib/utils";
import {
  getLocalOrderSnapshot,
  subscribeLocalOrders,
  type LocalOrder,
  type LocalOrderStatus,
} from "@/lib/local-orders";
import { TIERS } from "@/lib/pricing";

const STAGES: Array<{
  id: LocalOrderStatus;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "pending_payment",
    label: "Menunggu pembayaran",
    hint: "Selesaikan pembayaran agar shopper bisa mulai belanja.",
    icon: ShoppingBag,
  },
  {
    id: "shopping",
    label: "Shopper sedang belanja",
    hint: "Personal shopper sedang membelikan barang sesuai request.",
    icon: ShoppingBag,
  },
  {
    id: "packed",
    label: "Barang dikemas",
    hint: "Semua barang sudah ditemukan dan siap diserahkan ke kurir.",
    icon: PackageCheck,
  },
  {
    id: "in_transit",
    label: "Dalam perjalanan",
    hint: "Paket sedang dikirim dari Bandung ke Samarinda.",
    icon: Truck,
  },
  {
    id: "delivered",
    label: "Sudah diterima",
    hint: "Barang sudah diterima customer di lokasi tujuan.",
    icon: CircleCheck,
  },
];

export function TrackingClient({ token }: { token: string }) {
  const order = useSyncExternalStore<LocalOrder | null>(
    subscribeLocalOrders,
    () => getLocalOrderSnapshot(token),
    () => null,
  );

  if (order === null) {
    return (
      <GlassCard className="mt-8 p-10 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-[hsl(var(--surface-2))] grid place-items-center text-[hsl(var(--muted-foreground))]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Pesanan tidak ditemukan</h2>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
          Token tracking tidak ditemukan di perangkat ini. Bawabawa.id menyimpan
          token tracking di browser tempat pesanan dibuat — coba buka di perangkat
          yang sama, atau hubungi CS jika kamu sudah punya akun.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild variant="primary">
            <Link href="/kontak">Hubungi CS</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/request">Buat pesanan baru</Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  const currentStageIdx = STAGES.findIndex((s) => s.id === order.status);
  const tier = TIERS[order.tier];

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Kode pesanan</p>
              <p className="font-mono text-lg font-semibold">{order.code}</p>
            </div>
            <Badge variant={order.status === "delivered" ? "success" : "info"}>
              {STAGES[currentStageIdx]?.label ?? order.status}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            Dibuat {formatDate(order.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            {order.tripCode ? <>{" · "}Trip {order.tripCode}</> : null}
            {" · "}Tipe {tier.label}
          </p>

          <ol className="mt-6 space-y-3">
            {STAGES.map((stage, idx) => {
              const done = idx < currentStageIdx;
              const active = idx === currentStageIdx;
              const StageIcon = stage.icon;
              return (
                <li key={stage.id} className="flex items-start gap-3">
                  <span
                    className={[
                      "h-8 w-8 shrink-0 rounded-full grid place-items-center",
                      done
                        ? "bg-[hsl(var(--emerald-500))] text-white"
                        : active
                          ? "bg-[hsl(var(--sage-700))] text-white"
                          : "bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-foreground))]",
                    ].join(" ")}
                  >
                    {done ? <CircleCheck className="h-4 w-4" /> : <StageIcon className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className={["text-sm", active ? "font-semibold" : ""].join(" ")}>{stage.label}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{stage.hint}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">Detail pesanan</h3>
          <div className="mt-3 divide-y divide-[hsl(var(--border))]">
            {order.items.map((it, i) => (
              <div key={i} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {it.category} · qty {it.qty}
                    {it.notes ? ` · ${it.notes}` : ""}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{formatIDR(it.estPrice * it.qty)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-[hsl(var(--surface-2))] p-4 text-sm space-y-2">
            <Row label="Subtotal barang" value={formatIDR(order.pricing.itemsTotal)} />
            <Row label="Fee jasa titip" value={formatIDR(order.pricing.jastipFee)} />
            <Row
              label={`Ongkir ${tier.label} (${order.pricing.billingKg.toFixed(1)} kg)`}
              value={formatIDR(order.pricing.shippingFee)}
            />
            <Row label="PPN 11%" value={formatIDR(order.pricing.ppn)} />
            <div className="border-t border-[hsl(var(--border))] pt-2 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-semibold tabular-nums">{formatIDR(order.pricing.total)}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <aside className="space-y-4">
        <GlassCard className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
            Alamat pengiriman
          </p>
          <p className="mt-3 text-sm font-semibold">{order.address.name}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{order.address.phone}</p>
          <p className="mt-2 text-sm leading-relaxed">{order.address.street}</p>
          <p className="text-sm">{order.address.city}, {order.address.postal}</p>
          {order.address.notes && (
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Catatan: {order.address.notes}</p>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
            Butuh bantuan?
          </p>
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            Hubungi tim kami untuk update status, perubahan alamat, atau pembatalan.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="primary">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER ?? "6281234567890"}?text=${encodeURIComponent(
                  `Halo Bawabawa.id, saya mau tanya soal pesanan ${order.code} (${token})`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" /> Chat WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/kontak">Pusat bantuan</Link>
            </Button>
          </div>
        </GlassCard>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
