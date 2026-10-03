import { PageHeader } from "@/components/dashboard/page-header";
import { BlogClient } from "./blog-client";

export default function AdminBlogPage() {
  return (
    <>
      <PageHeader
        title="Artikel"
        description="Tulis artikel, simpan sebagai draf, lalu terbitkan. Artikel yang terbit tampil di halaman Blog."
      />
      <BlogClient />
    </>
  );
}
