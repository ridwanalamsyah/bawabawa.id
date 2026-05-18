import { PageHeader } from "@/components/dashboard/page-header";
import { ImportsClient } from "./imports-client";

export default function AdminImportsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Imports"
        title="Import data ke ERP"
        description="Upload CSV untuk import produk secara massal. Hasil preview ditampilkan sebelum commit."
      />
      <ImportsClient />
    </>
  );
}
