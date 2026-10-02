import { redirect } from "next/navigation";

// This page used to render hardcoded demo data (fake addresses, chats and
// notifications) to real customers. Everything a customer needs now lives
// on the orders page and the per-order tracking link.
export default function LegacyDashboardPage() {
  redirect("/dashboard/orders");
}
