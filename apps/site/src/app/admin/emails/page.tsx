import { PageHeader } from "@/components/dashboard/page-header";
import { EmailsClient } from "./emails-client";

export default function AdminEmailsPage() {
  return (
    <>
      <PageHeader
        title="Riwayat email"
        description="Log email transactional yang dikirim via Resend (konfirmasi order, invoice, dst.)."
      />
      <EmailsClient />
    </>
  );
}
