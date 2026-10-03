import { PageHeader } from "@/components/dashboard/page-header";
import { ProcurementClient } from "./procurement-client";

export default function AdminProcurementPage() {
  return (
    <>
      <PageHeader
        title="Pembelian stok ke supplier"
        description="Daftar PO terbuka, total nilai, dan status."
      />
      <ProcurementClient />
    </>
  );
}
