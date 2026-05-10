import type { Metadata } from "next";
import { RequestFlow } from "./flow";

export const metadata: Metadata = {
  title: "Titip Sekarang",
  description: "Buat request titipan barang dari Bandung ke Samarinda dengan estimasi biaya realtime.",
};

export default function RequestPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Titip Sekarang
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            Buat request titipan dari Bandung.
          </h1>
          <p className="mt-4 text-base text-[hsl(var(--muted-foreground))]">
            Upload link Shopee/Tokopedia atau ketik manual. Estimasi biaya tampil otomatis.
          </p>
        </div>
        <div className="mt-10">
          <RequestFlow />
        </div>
      </div>
    </section>
  );
}
