import { PageHeader } from "@/components/dashboard/page-header";
import { LeadsClient } from "./leads-client";

export default function AdminLeadsPage() {
  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Leads & funnel"
        description="Calon customer yang masih di tahap pre-order (form kontak, DM, follow-up sales)."
      />
      <LeadsClient />
    </>
  );
}
