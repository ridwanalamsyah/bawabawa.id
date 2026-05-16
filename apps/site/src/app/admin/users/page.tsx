import { PageHeader } from "@/components/dashboard/page-header";
import { UsersAdminClient } from "./users-client";

export const metadata = {
  title: "Tim & Admin · Bawabawa.id",
};

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tim & Admin"
        title="Akses tim Bawabawa.id"
        description="Daftar admin yang punya akses ke konsol internal. Approve pendaftar Google baru, kelola role, atau suspend akses lama."
      />
      <UsersAdminClient />
    </>
  );
}
