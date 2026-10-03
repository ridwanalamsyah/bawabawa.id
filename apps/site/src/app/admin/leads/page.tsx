import { PageHeader } from "@/components/dashboard/page-header";
import { LeadsClient } from "./leads-client";

export default function AdminLeadsPage() {
  return (
    <>
      <PageHeader
        title="Calon pelanggan"
        description="Calon customer yang masih di tahap pre-order (form kontak, DM, follow-up sales)."
      />
      <LeadsClient />
    </>
  );
}
