import { PageHeader } from "@/components/dashboard/page-header";
import { CustomersClient } from "./customers-client";

export default function AdminCustomersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Customer"
        title="Customer management"
        description="Daftar customer yang sudah pernah memesan atau dimasukkan secara manual oleh admin."
      />
      <CustomersClient />
    </>
  );
}
