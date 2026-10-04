import { PageHeader } from "@/components/dashboard/page-header";
import { UsersAdminClient } from "./users-client";

export const metadata = {
  title: "Tim admin · Bawabawa.id",
};

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader
        title="Tim admin"
        description="Orang yang boleh membuka halaman admin ini."
      />
      <UsersAdminClient />
    </>
  );
}
