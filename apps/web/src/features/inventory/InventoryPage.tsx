import { useEffect, useState } from "react";
import { ModuleShell, type ModuleKpi } from "../../shared/ui/ModuleShell";
import { api } from "../../shared/api/client";
import { formatNumber } from "../../shared/lib/format";

interface InventoryMovement {
  id: string;
  productId?: string;
  delta?: number;
}

export function InventoryPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<{ data?: InventoryMovement[] }>("/inventory/movements")
      .then((response) => {
        if (!active) return;
        const next = response.data?.data;
        setMovements(Array.isArray(next) ? next : []);
      })
      .catch(() => {
        if (active) setMovements([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totalMovements = movements.length;
  const incoming = movements.filter((m) => (m.delta ?? 0) > 0).length;
  const outgoing = movements.filter((m) => (m.delta ?? 0) < 0).length;
  const products = new Set(movements.map((m) => m.productId).filter(Boolean)).size;

  const kpis: ModuleKpi[] = [
    { label: "Pergerakan", value: formatNumber(totalMovements), hint: "Total transaksi stok" },
    { label: "Masuk", value: formatNumber(incoming), tone: "positive" },
    { label: "Keluar", value: formatNumber(outgoing), tone: "warn" },
    { label: "Produk Aktif", value: formatNumber(products) }
  ];

  return (
    <ModuleShell
      title="Inventaris"
      subtitle="Kontrol stok multi-gudang, riwayat pergerakan barang, dan reservasi untuk pesanan."
      kpis={kpis}
      loading={loading}
      empty={
        totalMovements === 0
          ? {
              icon: "📦",
              title: "Belum ada pergerakan stok",
              description:
                "Stok masuk, keluar, dan adjustment akan tercatat di sini begitu transaksi pertama terjadi."
            }
          : undefined
      }
    />
  );
}
