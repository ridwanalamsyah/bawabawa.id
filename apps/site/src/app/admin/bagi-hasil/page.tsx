import { PageHeader } from "@/components/dashboard/page-header";
import { BagiHasilClient } from "./bagi-hasil-client";

export default function AdminBagiHasilPage() {
  return (
    <>
      <PageHeader
        eyebrow="Bagi hasil"
        title="Aturan komisi & bagi hasil"
        description="Persentase bagi hasil per role/shopper dan cadangan operasional. Diterapkan otomatis saat menghitung settlement per trip."
      />
      <BagiHasilClient />
    </>
  );
}
