import { PageHeader } from "@/components/dashboard/page-header";
import { EmailsClient } from "./emails-client";

export default function AdminEmailsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Email"
        title="Outbox email"
        description="Log email transactional yang dikirim via Resend (konfirmasi order, invoice, dst.)."
      />
      <EmailsClient />
    </>
  );
}
