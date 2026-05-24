"use client";

import { ErpListPage, type Column } from "@/components/admin/erp-list-page";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";

type Lead = {
  id: string;
  customerId?: string | null;
  name: string;
  stage: string;
  ownerId?: string | null;
  expectedValue?: number | string;
  createdAt?: string;
};

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

const COLUMNS: Column<Lead>[] = [
  { key: "name", header: "Nama", render: (r) => <span className="font-medium">{r.name}</span> },
  {
    key: "stage",
    header: "Tahap",
    render: (r) => (
      <Badge variant={r.stage === "won" ? "success" : r.stage === "lost" ? "danger" : "info"}>
        {r.stage}
      </Badge>
    ),
  },
  {
    key: "value",
    header: "Estimasi nilai",
    className: "text-right tabular-nums",
    render: (r) => formatIDR(toNum(r.expectedValue)),
  },
  { key: "owner", header: "Sales", render: (r) => <span className="font-mono text-xs">{r.ownerId ?? "—"}</span> },
  {
    key: "created",
    header: "Masuk",
    render: (r) => (r.createdAt ? formatDate(r.createdAt, { day: "numeric", month: "short" }) : "—"),
  },
];

export function LeadsClient() {
  return (
    <ErpListPage<Lead>
      endpoint="/api/admin/leads"
      columns={COLUMNS}
      emptyMessage="Belum ada lead masuk."
      rowKey={(r) => r.id}
    />
  );
}
