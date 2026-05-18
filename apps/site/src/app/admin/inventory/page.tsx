import { PageHeader } from "@/components/dashboard/page-header";
import { InventoryClient } from "./inventory-client";

export default function AdminInventoryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Stok produk & log pergerakan"
        description="Pantau stok per produk + cabang dan riwayat adjustment / transfer."
      />
      <InventoryClient />
    </>
  );
}
