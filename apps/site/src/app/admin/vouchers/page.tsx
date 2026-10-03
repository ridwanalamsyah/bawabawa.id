import { PageHeader } from "@/components/dashboard/page-header";
import { VouchersClient } from "./vouchers-client";

export default function AdminVouchersPage() {
  return (
    <>
      <PageHeader
        title="Promo & banner"
        description="Buat kode promo, lalu pilih &ldquo;Tampilkan di banner&rdquo; supaya muncul di strip promo atas beranda."
      />
      <VouchersClient />
    </>
  );
}
