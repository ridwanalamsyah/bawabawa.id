"use client";

import { ErpListPage, type Column } from "@/components/admin/erp-list-page";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type EmailRow = {
  id: string;
  toEmail: string;
  templateKey?: string;
  status: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  attempts?: number;
  lastError?: string | null;
};

const COLUMNS: Column<EmailRow>[] = [
  { key: "to", header: "Tujuan", render: (r) => r.toEmail },
  { key: "template", header: "Template", render: (r) => r.templateKey ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge variant={r.status === "sent" || r.status === "delivered" ? "success" : r.status === "failed" ? "danger" : "info"}>
        {r.status}
      </Badge>
    ),
  },
  {
    key: "scheduled",
    header: "Dijadwalkan",
    render: (r) => (r.scheduledAt ? formatDate(r.scheduledAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"),
  },
  {
    key: "sent",
    header: "Terkirim",
    render: (r) => (r.sentAt ? formatDate(r.sentAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"),
  },
  { key: "attempts", header: "Attempt", className: "text-right tabular-nums", render: (r) => r.attempts ?? 0 },
];

export function EmailsClient() {
  return (
    <ErpListPage<EmailRow>
      endpoint="/api/admin/emails"
      columns={COLUMNS}
      emptyMessage="Belum ada email terkirim. Resend belum diaktifkan / belum ada trigger."
      rowKey={(r) => r.id}
      footer="Resend API key di-config via env RESEND_API_KEY + RESEND_FROM_EMAIL."
    />
  );
}
