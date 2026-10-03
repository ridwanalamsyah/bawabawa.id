import { PageHeader } from "@/components/dashboard/page-header";
import { WhatsappClient } from "./whatsapp-client";

export default function AdminWhatsappPage() {
  return (
    <>
      <PageHeader
        title="Riwayat WhatsApp"
        description="Pesan WhatsApp otomatis yang terkirim ke pelanggan dan tim (konfirmasi pesanan, update pengiriman)."
      />
      <WhatsappClient />
    </>
  );
}
