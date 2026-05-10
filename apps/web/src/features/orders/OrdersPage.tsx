import { useEffect, useState } from "react";
import { ModuleShell, type ModuleKpi } from "../../shared/ui/ModuleShell";
import { api } from "../../shared/api/client";
import { formatIdr, formatNumber } from "../../shared/lib/format";

interface OrderSummary {
  id: string;
  status?: string;
  totalAmount?: number;
}

const ACTIVE_STATUSES = new Set([
  "draft",
  "payment_pending",
  "payment_dp",
  "payment_paid",
  "stock_reserved",
  "packed",
  "shipped"
]);

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<{ data?: OrderSummary[] }>("/orders")
      .then((response) => {
        if (!active) return;
        const next = response.data?.data;
        setOrders(Array.isArray(next) ? next : []);
        setError(false);
      })
      .catch(() => {
        if (!active) return;
        setOrders([]);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const total = orders.length;
  const aktif = orders.filter((order) => ACTIVE_STATUSES.has(order.status ?? "")).length;
  const selesai = orders.filter(
    (order) => order.status === "posted_finance" || order.status === "shipped"
  ).length;
  const nilai = orders.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0);

  const kpis: ModuleKpi[] = [
    { label: "Total Pesanan", value: formatNumber(total) },
    { label: "Sedang Berjalan", value: formatNumber(aktif), tone: "positive" },
    { label: "Sudah Selesai", value: formatNumber(selesai), tone: "muted" },
    { label: "Nilai Pesanan", value: formatIdr(nilai) }
  ];

  return (
    <ModuleShell
      title="Pesanan"
      subtitle="Buat pesanan baru, pantau status pembayaran, pengiriman, dan invoice — semua dalam satu kanvas."
      kpis={kpis}
      loading={loading}
      empty={
        total === 0
          ? {
              icon: "🛒",
              title: error ? "Belum bisa memuat pesanan" : "Belum ada pesanan",
              description: error
                ? "Periksa koneksi atau coba muat ulang halaman."
                : "Pesanan pertama akan tampil di sini begitu dibuat. Buat pesanan baru untuk memulai."
            }
          : undefined
      }
    />
  );
}
