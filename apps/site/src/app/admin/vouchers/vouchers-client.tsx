"use client";

import { ErpListPage, type Column } from "@/components/admin/erp-list-page";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatDate } from "@/lib/utils";

type Voucher = {
  id: string;
  code: string;
  type?: string;
  discountType?: string;
  discountValue?: number | string;
  minOrderAmount?: number | string;
  maxUses?: number | null;
  usedCount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
};

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

const COLUMNS: Column<Voucher>[] = [
  { key: "code", header: "Kode", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
  { key: "type", header: "Tipe", render: (r) => <Badge variant="info">{r.discountType ?? r.type ?? "—"}</Badge> },
  {
    key: "value",
    header: "Nilai",
    className: "text-right tabular-nums",
    render: (r) =>
      r.discountType === "percent"
        ? `${toNum(r.discountValue)}%`
        : formatIDR(toNum(r.discountValue)),
  },
  {
    key: "min",
    header: "Min order",
    className: "text-right tabular-nums",
    render: (r) => (r.minOrderAmount ? formatIDR(toNum(r.minOrderAmount)) : "—"),
  },
  {
    key: "uses",
    header: "Kuota",
    className: "text-right tabular-nums",
    render: (r) =>
      `${r.usedCount ?? 0}${typeof r.maxUses === "number" ? ` / ${r.maxUses}` : ""}`,
  },
  {
    key: "period",
    header: "Berlaku",
    render: (r) => {
      const start = r.startsAt ? formatDate(r.startsAt, { day: "numeric", month: "short" }) : "—";
      const end = r.endsAt ? formatDate(r.endsAt, { day: "numeric", month: "short" }) : "—";
      return `${start} → ${end}`;
    },
  },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge variant={r.isActive ? "success" : "neutral"}>
        {r.isActive ? "Aktif" : "Nonaktif"}
        {r.isPublic ? " · publik" : ""}
      </Badge>
    ),
  },
];

export function VouchersClient() {
  return (
    <ErpListPage<Voucher>
      endpoint="/api/admin/vouchers"
      columns={COLUMNS}
      emptyMessage="Belum ada voucher. Buat lewat ERP /vouchers."
      rowKey={(r) => r.id}
      footer="Untuk membuat voucher baru sementara via API POST /api/v1/vouchers. UI builder menyusul."
    />
  );
}
