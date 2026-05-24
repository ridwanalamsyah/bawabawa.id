"use client";

import * as React from "react";
import { GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";

type Invoice = {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string | null;
  status: string;
  issuedAt: string | null;
  postedAt: string | null;
  totalAmount: string | number | null;
  paymentStatus: string | null;
  createdAt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  issued: "Issued",
  posted: "Posted",
  paid: "Paid",
  void: "Void",
};

function toNumber(v: string | number | null): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

export function InvoicesClient() {
  const [rows, setRows] = React.useState<Invoice[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/invoices", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setError(`Gagal memuat invoice (${res.status})`);
          return;
        }
        const data = (await res.json()) as Invoice[] | { error?: string };
        if (cancelled) return;
        if (Array.isArray(data)) {
          setRows(data);
        } else {
          setError(data.error ?? "Format response tak terduga");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Gagal terhubung ke server");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--surface-2))] text-left text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            <tr>
              <th className="px-4 py-3">No. Invoice</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pembayaran</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Posted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[hsl(var(--muted-foreground))]">
                  Memuat…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[hsl(var(--rose-700))]">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[hsl(var(--muted-foreground))]">
                  Belum ada invoice. Generate dari halaman Pesanan.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              rows.map((inv) => (
                <tr key={inv.id} className="hover:bg-[hsl(var(--surface-2)/0.5)]">
                  <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-mono text-xs">{inv.orderNumber ?? inv.orderId}</td>
                  <td className="px-4 py-3">
                    <Badge variant={inv.status === "posted" || inv.status === "paid" ? "success" : "info"}>
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">{inv.paymentStatus ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIDR(toNumber(inv.totalAmount))}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {inv.issuedAt ? formatDate(inv.issuedAt, { day: "numeric", month: "short" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {inv.postedAt ? formatDate(inv.postedAt, { day: "numeric", month: "short" }) : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
