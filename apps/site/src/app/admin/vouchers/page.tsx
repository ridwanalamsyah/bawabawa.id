import { PageHeader } from "@/components/dashboard/page-header";
import { VouchersClient } from "./vouchers-client";

export default function AdminVouchersPage() {
  return (
    <>
      <PageHeader
        title="Promo"
        description="Kode diskon untuk pembeli. Nyalakan &ldquo;Tampil di banner&rdquo; supaya kodenya muncul di atas beranda."
      />
      <VouchersClient />
    </>
  );
}
