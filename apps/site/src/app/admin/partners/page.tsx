import { PageHeader } from "@/components/dashboard/page-header";
import { PartnersClient } from "./partners-client";

export default function AdminPartnersPage() {
  return (
    <>
      <PageHeader
        title="Reseller & B2B"
        description="Pendaftar reseller, kulakan B2B, dan afiliasi dari halaman /reseller."
      />
      <PartnersClient />
    </>
  );
}
