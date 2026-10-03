import { PageHeader } from "@/components/dashboard/page-header";
import { PosClient } from "./pos-client";

export default function AdminPosPage() {
  return (
    <>
      <PageHeader
        title="Input pesanan dari Instagram / WA / DM"
        description="Masukkan pesanan yang datang lewat channel offline (Instagram, WA, telepon). Pesanan akan muncul di daftar Pesanan dan Invoice seperti pesanan dari website."
      />
      <PosClient />
    </>
  );
}
