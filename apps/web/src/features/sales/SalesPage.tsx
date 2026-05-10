import { useEffect, useState } from "react";
import { ModuleShell, type ModuleKpi } from "../../shared/ui/ModuleShell";
import { api } from "../../shared/api/client";
import { formatIdr, formatNumber } from "../../shared/lib/format";

interface OrderSummary {
  id: string;
  status?: string;
  totalAmount?: number;
}

const POSTED = new Set(["invoiced", "posted_finance"]);

export function SalesPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<{ data?: OrderSummary[] }>("/orders")
      .then((response) => {
        if (!active) return;
        const next = response.data?.data;
        setOrders(Array.isArray(next) ? next : []);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totalSales = orders.filter((o) => POSTED.has(o.status ?? "")).length;
  const totalRevenue = orders
    .filter((o) => POSTED.has(o.status ?? ""))
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
  const pipeline = orders
    .filter((o) => !POSTED.has(o.status ?? ""))
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  const kpis: ModuleKpi[] = [
    { label: "Penjualan", value: formatNumber(totalSales), hint: "Pesanan ter-invoice" },
    { label: "Pendapatan", value: formatIdr(totalRevenue), tone: "positive" },
    { label: "Pipeline", value: formatIdr(pipeline), tone: "muted", hint: "Belum ditagih" }
  ];

  return (
    <ModuleShell
      title="Penjualan"
      subtitle="Pantau pipeline pesanan, target, dan pendapatan tim sales secara real-time."
      kpis={kpis}
      loading={loading}
      empty={
        orders.length === 0
          ? {
              icon: "📈",
              title: "Pipeline masih kosong",
              description:
                "Belum ada pesanan yang diproses. Pendapatan dan progress sales akan muncul di sini setelah pesanan pertama dibuat.",
              actionLabel: "Buka Pesanan",
              actionTo: "/orders"
            }
          : undefined
      }
    />
  );
}
