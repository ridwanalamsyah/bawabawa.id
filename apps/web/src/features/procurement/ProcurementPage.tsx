import { useEffect, useState } from "react";
import { ModuleShell, type ModuleKpi } from "../../shared/ui/ModuleShell";
import { api } from "../../shared/api/client";
import { formatIdr, formatNumber } from "../../shared/lib/format";

interface PurchaseOrder {
  id: string;
  status?: string;
  totalAmount?: number;
}

const APPROVED = new Set(["approved", "received", "completed"]);

export function ProcurementPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<{ data?: PurchaseOrder[] }>("/procurement/purchase-orders")
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

  const total = orders.length;
  const draft = orders.filter((o) => o.status === "draft").length;
  const approved = orders.filter((o) => APPROVED.has(o.status ?? "")).length;
  const totalValue = orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  const kpis: ModuleKpi[] = [
    { label: "Purchase Order", value: formatNumber(total) },
    { label: "Draft", value: formatNumber(draft), tone: "muted" },
    { label: "Disetujui", value: formatNumber(approved), tone: "positive" },
    { label: "Nilai PO", value: formatIdr(totalValue) }
  ];

  return (
    <ModuleShell
      title="Pengadaan"
      subtitle="Kelola pembelian: dari purchase request, persetujuan, sampai penerimaan barang dari supplier."
      kpis={kpis}
      loading={loading}
      empty={
        total === 0
          ? {
              icon: "🧾",
              title: "Belum ada purchase order",
              description:
                "Buat purchase order pertama untuk mulai mencatat pembelian, supplier, dan penerimaan barang."
            }
          : undefined
      }
    />
  );
}
