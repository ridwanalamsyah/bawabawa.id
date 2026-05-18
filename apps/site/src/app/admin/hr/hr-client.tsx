"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErpListPage, type Column } from "@/components/admin/erp-list-page";
import { formatIDR, formatDate } from "@/lib/utils";

type Employee = {
  id: string;
  userId?: string | null;
  employeeCode: string;
  positionTitle: string;
  salaryBase: number | string;
  joinedAt: string | null;
  status: string;
};

type Attendance = {
  id: string;
  employeeId: string;
  attendanceDate: string;
  status: string;
  checkInAt: string | null;
  employeeCode?: string;
  positionTitle?: string;
};

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

const EMPLOYEE_COLUMNS: Column<Employee>[] = [
  { key: "code", header: "Kode", render: (r) => <span className="font-mono text-xs">{r.employeeCode}</span> },
  { key: "title", header: "Jabatan", render: (r) => r.positionTitle },
  {
    key: "salary",
    header: "Gaji pokok",
    className: "text-right tabular-nums",
    render: (r) => formatIDR(toNum(r.salaryBase)),
  },
  {
    key: "joined",
    header: "Bergabung",
    render: (r) => (r.joinedAt ? formatDate(r.joinedAt, { day: "numeric", month: "short", year: "numeric" }) : "—"),
  },
  { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "active" ? "success" : "neutral"}>{r.status}</Badge> },
];

const ATTENDANCE_COLUMNS: Column<Attendance>[] = [
  {
    key: "date",
    header: "Tanggal",
    render: (r) => formatDate(r.attendanceDate, { day: "numeric", month: "short", year: "numeric" }),
  },
  { key: "employee", header: "Pegawai", render: (r) => r.employeeCode ?? r.employeeId },
  { key: "title", header: "Jabatan", render: (r) => r.positionTitle ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (r) => (
      <Badge variant={r.status === "present" ? "success" : r.status === "late" ? "info" : "neutral"}>
        {r.status}
      </Badge>
    ),
  },
  {
    key: "checkin",
    header: "Check-in",
    render: (r) => (r.checkInAt ? formatDate(r.checkInAt, { hour: "2-digit", minute: "2-digit" }) : "—"),
  },
];

export function HrClient() {
  const [tab, setTab] = React.useState<"employees" | "attendance">("employees");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant={tab === "employees" ? "primary" : "outline"} size="sm" onClick={() => setTab("employees")}>
          Pegawai
        </Button>
        <Button variant={tab === "attendance" ? "primary" : "outline"} size="sm" onClick={() => setTab("attendance")}>
          Absensi
        </Button>
      </div>
      {tab === "employees" ? (
        <ErpListPage<Employee>
          endpoint="/api/admin/hr-employees"
          columns={EMPLOYEE_COLUMNS}
          emptyMessage="Belum ada pegawai terdaftar."
          rowKey={(r) => r.id}
        />
      ) : (
        <ErpListPage<Attendance>
          endpoint="/api/admin/hr-attendance"
          columns={ATTENDANCE_COLUMNS}
          emptyMessage="Belum ada log absensi."
          rowKey={(r) => r.id}
        />
      )}
    </div>
  );
}
