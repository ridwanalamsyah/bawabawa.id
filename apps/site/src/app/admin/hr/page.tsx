import { PageHeader } from "@/components/dashboard/page-header";
import { HrClient } from "./hr-client";

export default function AdminHrPage() {
  return (
    <>
      <PageHeader
        title="Pegawai & absensi"
        description="Daftar pegawai aktif dan catatan absensi harian."
      />
      <HrClient />
    </>
  );
}
