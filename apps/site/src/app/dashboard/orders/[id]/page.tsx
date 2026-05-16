import { redirect } from "next/navigation";

// Mock-data detail page was removed when /dashboard/orders moved to the
// localStorage-backed listing (see `apps/site/src/app/dashboard/orders/page.tsx`).
// Tracking lives at `/track/[token]`, which works for both authenticated
// and guest customers. Until the ERP /orders/:id detail view is wired,
// redirect requests to this legacy path back to the orders list.
export default async function OrderDetailLegacyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/track/${id}`);
}
