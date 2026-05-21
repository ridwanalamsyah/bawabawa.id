import { PageHeader } from "@/components/dashboard/page-header";
import { VouchersClient } from "./vouchers-client";

export default function AdminVouchersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Vouchers & Promo"
        title="Kode promo & voucher"
        description="Daftar voucher aktif, periode berlaku, dan kuota. Voucher publik muncul di halaman promotion."
      />
      <VouchersClient />
    </>
  );
}
