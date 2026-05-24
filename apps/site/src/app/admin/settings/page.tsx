import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsClient } from "./settings-client";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pengaturan"
        title="Konfigurasi platform"
        description="Atur brand, kontak, sosial, dan ongkir default. Semua nilai disimpan ke database — tidak ada hardcode."
      />
      <SettingsClient />
    </>
  );
}
