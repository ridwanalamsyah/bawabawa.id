import { PageHeader } from "@/components/dashboard/page-header";
import { InventoryClient } from "./inventory-client";

export default function AdminInventoryPage() {
  return (
    <>
      <PageHeader
        title="Stok barang"
        description="Pantau stok per produk + cabang dan riwayat adjustment / transfer."
      />
      <InventoryClient />
    </>
  );
}
