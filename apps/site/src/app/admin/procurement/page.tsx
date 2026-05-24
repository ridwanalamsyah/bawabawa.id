import { PageHeader } from "@/components/dashboard/page-header";
import { ProcurementClient } from "./procurement-client";

export default function AdminProcurementPage() {
  return (
    <>
      <PageHeader
        eyebrow="Procurement"
        title="Purchase Order ke supplier"
        description="Daftar PO terbuka, total nilai, dan status."
      />
      <ProcurementClient />
    </>
  );
}
