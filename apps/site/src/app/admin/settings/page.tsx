import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsClient } from "./settings-client";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Tampilan situs"
        description="Ubah kontak, sosial media, teks beranda, tanya-jawab, dan animasi situs. Perubahan tampil di situs dalam ±1 menit."
      />
      <SettingsClient />
    </>
  );
}
