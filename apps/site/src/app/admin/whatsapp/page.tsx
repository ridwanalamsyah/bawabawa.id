import { PageHeader } from "@/components/dashboard/page-header";
import { WhatsappClient } from "./whatsapp-client";

export default function AdminWhatsappPage() {
  return (
    <>
      <PageHeader
        eyebrow="WhatsApp"
        title="Outbox notifikasi WhatsApp"
        description="Log notifikasi WA yang dikirim via Fonnte. Pesan transactional (konfirmasi order, update tracking) di-enqueue otomatis dari ERP."
      />
      <WhatsappClient />
    </>
  );
}
