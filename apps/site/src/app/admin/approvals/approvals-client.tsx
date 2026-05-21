"use client";

import { ErpListPage, type Column } from "@/components/admin/erp-list-page";
import { Badge } from "@/components/ui/badge";

type Approval = {
  id: string;
  moduleName: string;
  entityId: string;
  levelRequired: number;
  currentLevel: number;
  status: string;
  requestedBy?: string | null;
};

const COLUMNS: Column<Approval>[] = [
  { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
  { key: "module", header: "Modul", render: (r) => <Badge variant="info">{r.moduleName}</Badge> },
  { key: "entity", header: "Entity", render: (r) => <span className="font-mono text-xs">{r.entityId}</span> },
  {
    key: "progress",
    header: "Progress",
    className: "text-right tabular-nums",
    render: (r) => `${r.currentLevel} / ${r.levelRequired}`,
  },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge
        variant={
          r.status === "executed" || r.status === "approved"
            ? "success"
            : r.status === "rejected"
              ? "danger"
              : "info"
        }
      >
        {r.status}
      </Badge>
    ),
  },
];

export function ApprovalsClient() {
  return (
    <ErpListPage<Approval>
      endpoint="/api/admin/approvals"
      columns={COLUMNS}
      emptyMessage="Tidak ada permintaan approval yang menunggu."
      rowKey={(r) => r.id}
      footer="Approve/reject lewat API: POST /approvals/:id/approve atau /reject."
    />
  );
}
