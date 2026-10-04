import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { OrdersClient } from "./orders-client";
import { ORDER_REQUEST_STATUSES_LIST } from "@/lib/order-requests";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ antrean?: string }> }) {
  const { antrean } = await searchParams;
  const initialQueue = antrean === "all" || ORDER_REQUEST_STATUSES_LIST.includes(antrean as never) ? (antrean as never) : undefined;
  return (
    <>
      <PageHeader
        title="Pesanan masuk"
        description="Request & checkout katalog dari situs. Kerjakan per antrean: cek → kirim penawaran → tunggu bayar → belikan → kemas → kirim."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/pos">
              <Plus className="h-4 w-4" aria-hidden /> Order manual (IG/WA)
            </Link>
          </Button>
        }
      />
      <OrdersClient initialQueue={initialQueue} />
    </>
  );
}
