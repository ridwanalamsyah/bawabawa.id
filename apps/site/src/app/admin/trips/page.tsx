import { PageHeader } from "@/components/dashboard/page-header";
import { TripsClient } from "./trips-client";

export default function AdminTripsPage() {
  return (
    <>
      <PageHeader
        title="Jadwal Open Trip"
        description="Buat jadwal keberangkatan. Jadwal muncul di halaman Open Trip setelah kamu tekan &ldquo;Tampilkan&rdquo;."
      />
      <TripsClient />
    </>
  );
}
