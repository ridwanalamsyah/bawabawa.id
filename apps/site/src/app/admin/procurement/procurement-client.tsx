"use client";

import { ErpListPage, type Column } from "@/components/admin/erp-list-page";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/utils";

type PO = {
  id: string;
  supplierId?: string;
  branchId?: string;
  status: string;
  totalAmount?: number | string;
  total_amount?: number | string;
};

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

const COLUMNS: Column<PO>[] = [
  { key: "id", header: "PO ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
  { key: "supplier", header: "Supplier", render: (r) => <span className="font-mono text-xs">{r.supplierId ?? "—"}</span> },
  { key: "branch", header: "Cabang", render: (r) => <span className="font-mono text-xs">{r.branchId ?? "—"}</span> },
  { key: "status", header: "Status", render: (r) => <Badge variant="info">{r.status}</Badge> },
  {
    key: "total",
    header: "Total",
    className: "text-right tabular-nums",
    render: (r) => formatIDR(toNum(r.totalAmount ?? r.total_amount)),
  },
];

export function ProcurementClient() {
  return (
    <ErpListPage<PO>
      endpoint="/api/admin/procurement"
      columns={COLUMNS}
      emptyMessage="Belum ada Purchase Order."
      rowKey={(r) => r.id}
    />
  );
}
