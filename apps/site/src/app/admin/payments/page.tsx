import { PageHeader } from "@/components/dashboard/page-header";
import { OrdersClient } from "../orders/orders-client";

// Previously a table of mock orders. Payments are confirmed on the order
// itself, so this view is the "waiting for payment" queue.
export default function AdminPaymentsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Keuangan"
        title="Menunggu pembayaran"
        description="Cek mutasi / bukti transfer dari WhatsApp, lalu klik “Tandai sudah dibayar”."
      />
      <OrdersClient initialQueue="approved" />
    </>
  );
}
