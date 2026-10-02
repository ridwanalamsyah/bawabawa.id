import { redirect } from "next/navigation";

// Previously a mock customer list. Support conversations happen on
// WhatsApp; the outbox shows what was sent.
export default function AdminSupportPage() {
  redirect("/admin/whatsapp");
}
