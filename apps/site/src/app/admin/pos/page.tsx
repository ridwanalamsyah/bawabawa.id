import { PageHeader } from "@/components/dashboard/page-header";
import { PosClient } from "./pos-client";

export default function AdminPosPage() {
  return (
    <>
      <PageHeader
        eyebrow="POS / Order manual"
        title="Input pesanan dari Instagram / WA / DM"
        description="Masukkan pesanan yang datang lewat channel offline (Instagram, WA, telepon). Pesanan akan tercatat di ERP dan muncul di daftar Pesanan + Invoice seperti pesanan via website."
      />
      <PosClient />
    </>
  );
}
