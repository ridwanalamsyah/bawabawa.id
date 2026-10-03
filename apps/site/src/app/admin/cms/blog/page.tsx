import { PageHeader } from "@/components/dashboard/page-header";
import { BlogClient } from "./blog-client";

export default function AdminBlogPage() {
  return (
    <>
      <PageHeader
        eyebrow="CMS"
        title="Artikel blog"
        description="Tulis artikel (format Markdown), simpan sebagai draf, lalu terbitkan. Artikel terbit tampil di /blog."
      />
      <BlogClient />
    </>
  );
}
