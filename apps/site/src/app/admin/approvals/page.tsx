import { PageHeader } from "@/components/dashboard/page-header";
import { ApprovalsClient } from "./approvals-client";

export default function AdminApprovalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Approvals"
        title="Antrian persetujuan"
        description="Permintaan approval multi-level untuk transaksi yang butuh tanda tangan (finance, harga manual, dst.)."
      />
      <ApprovalsClient />
    </>
  );
}
