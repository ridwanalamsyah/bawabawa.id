import { PageHeader } from "@/components/dashboard/page-header";
import { ReviewsClient } from "./reviews-client";

export default function AdminReviewsPage() {
  return (
    <>
      <PageHeader
        title="Ulasan pelanggan"
        description="Ulasan masuk dari halaman lacak setelah pesanan diterima. Tampil di beranda hanya setelah dipublikasikan."
      />
      <ReviewsClient />
    </>
  );
}
