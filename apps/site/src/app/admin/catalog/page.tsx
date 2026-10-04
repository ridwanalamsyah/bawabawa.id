import { PageHeader } from "@/components/dashboard/page-header";
import { CatalogAdminClient } from "./catalog-client";

export default function AdminCatalogPage() {
  return (
    <>
      <PageHeader
        title="Katalog"
        description="Barang dengan harga pasti yang bisa langsung dipesan di /katalog. Harga di sini sudah termasuk jasa titip; ongkir dihitung dari berat."
      />
      <CatalogAdminClient />
    </>
  );
}
