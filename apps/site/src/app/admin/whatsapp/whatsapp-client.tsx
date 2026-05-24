"use client";

import { ErpListPage, type Column } from "@/components/admin/erp-list-page";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type WaLog = {
  id: string;
  templateCode?: string;
  to?: string;
  status: string;
  providerMessageId?: string | null;
  retryCount?: number;
  sentAt: string;
};

const COLUMNS: Column<WaLog>[] = [
  { key: "to", header: "Nomor", render: (r) => <span className="font-mono text-xs">{r.to ?? "—"}</span> },
  { key: "template", header: "Template", render: (r) => r.templateCode ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge variant={r.status === "sent" || r.status === "delivered" ? "success" : r.status === "failed" ? "danger" : "info"}>
        {r.status}
      </Badge>
    ),
  },
  { key: "retry", header: "Retry", className: "text-right tabular-nums", render: (r) => r.retryCount ?? 0 },
  {
    key: "sent",
    header: "Waktu",
    render: (r) => formatDate(r.sentAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  },
];

export function WhatsappClient() {
  return (
    <ErpListPage<WaLog>
      endpoint="/api/admin/whatsapp-logs"
      columns={COLUMNS}
      emptyMessage="Belum ada log WhatsApp. Setelah ERP enqueue notifikasi, akan muncul di sini."
      rowKey={(r) => r.id}
      footer="Fonnte device + template di-config di Pengaturan / ENV. Module siap pakai."
    />
  );
}
