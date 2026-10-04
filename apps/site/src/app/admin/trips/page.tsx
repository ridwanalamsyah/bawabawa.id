import { PageHeader } from "@/components/dashboard/page-header";
import { TripsClient } from "./trips-client";

export default function AdminTripsPage() {
  return (
    <>
      <PageHeader
        title="Jadwal Open Trip"
        description="Buat dan publish jadwal trip secara manual. Trip baru baru tampil di /open-trip setelah kamu publish."
      />
      <TripsClient />
    </>
  );
}
