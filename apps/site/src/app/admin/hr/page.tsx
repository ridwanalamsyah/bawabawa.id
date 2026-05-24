import { PageHeader } from "@/components/dashboard/page-header";
import { HrClient } from "./hr-client";

export default function AdminHrPage() {
  return (
    <>
      <PageHeader
        eyebrow="HR"
        title="Pegawai & absensi"
        description="Daftar pegawai aktif + log absensi harian. Payroll run dijalankan dari API /hr/payroll/run."
      />
      <HrClient />
    </>
  );
}
