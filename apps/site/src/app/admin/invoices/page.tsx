import { PageHeader } from "@/components/dashboard/page-header";
import { InvoicesClient } from "./invoices-client";

export default function AdminInvoicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Invoice"
        title="Daftar invoice"
        description="Semua invoice yang sudah di-generate untuk pesanan customer. Klik Post untuk membukukan invoice ke jurnal keuangan."
      />
      <InvoicesClient />
    </>
  );
}
