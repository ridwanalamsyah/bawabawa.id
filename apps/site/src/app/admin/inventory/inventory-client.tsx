"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ErpListPage, type Column } from "@/components/admin/erp-list-page";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  current_stock?: number | string;
  currentStock?: number | string;
  isActive?: boolean;
  is_active?: boolean;
};

type Movement = {
  id: string;
  productId: string;
  branchId?: string;
  movementType: string;
  qtyBefore: number | string;
  qtyChange: number | string;
  qtyAfter: number | string;
  referenceType?: string | null;
  createdAt: string;
};

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

const ITEM_COLUMNS: Column<Item>[] = [
  { key: "name", header: "Nama", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "sku", header: "SKU", render: (r) => <span className="font-mono text-xs">{r.sku ?? "—"}</span> },
  { key: "category", header: "Kategori", render: (r) => r.category ?? "—" },
  {
    key: "stock",
    header: "Stok",
    className: "text-right tabular-nums",
    render: (r) => toNum(r.currentStock ?? r.current_stock),
  },
  {
    key: "active",
    header: "Status",
    render: (r) => (
      <Badge variant={r.isActive ?? r.is_active ? "success" : "neutral"}>
        {(r.isActive ?? r.is_active) ? "Aktif" : "Nonaktif"}
      </Badge>
    ),
  },
];

const MOVEMENT_COLUMNS: Column<Movement>[] = [
  {
    key: "type",
    header: "Tipe",
    render: (m) => <Badge variant="info">{m.movementType}</Badge>,
  },
  { key: "product", header: "Product ID", render: (m) => <span className="font-mono text-xs">{m.productId}</span> },
  {
    key: "qty",
    header: "Qty",
    className: "text-right tabular-nums",
    render: (m) => `${toNum(m.qtyBefore)} → ${toNum(m.qtyAfter)} (${toNum(m.qtyChange) >= 0 ? "+" : ""}${toNum(m.qtyChange)})`,
  },
  { key: "ref", header: "Referensi", render: (m) => m.referenceType ?? "—" },
  {
    key: "createdAt",
    header: "Waktu",
    render: (m) => formatDate(m.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  },
];

export function InventoryClient() {
  const [tab, setTab] = React.useState<"items" | "movements">("items");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={tab === "items" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("items")}
        >
          Stok produk
        </Button>
        <Button
          variant={tab === "movements" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("movements")}
        >
          Riwayat pergerakan
        </Button>
      </div>

      {tab === "items" ? (
        <ErpListPage<Item>
          endpoint="/api/admin/inventory"
          columns={ITEM_COLUMNS}
          emptyMessage="Belum ada produk di stok."
          rowKey={(r) => r.id}
        />
      ) : (
        <ErpListPage<Movement>
          endpoint="/api/admin/inventory-movements"
          columns={MOVEMENT_COLUMNS}
          emptyMessage="Belum ada pergerakan stok."
          rowKey={(r) => r.id}
        />
      )}
    </div>
  );
}
