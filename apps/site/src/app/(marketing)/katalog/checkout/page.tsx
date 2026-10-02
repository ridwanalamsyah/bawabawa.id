import type { Metadata } from "next";
import { RequestFlow } from "../../request/flow";

export const metadata: Metadata = {
  title: "Checkout katalog",
  robots: { index: false, follow: false },
};

export default function CatalogCheckoutPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Checkout</h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Tanpa perlu akun — update pesanan dikirim ke WhatsApp-mu.
        </p>
        <div className="mt-8">
          <RequestFlow mode="catalog" />
        </div>
      </div>
    </section>
  );
}
