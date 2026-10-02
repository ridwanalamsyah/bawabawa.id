import type { Metadata } from "next";
import Link from "next/link";
import { RequestFlow } from "./flow";

export const metadata: Metadata = {
  title: "Titip Sekarang",
  description: "Titip barang apa saja dari Bandung ke Samarinda. Kami cek stok & harga dulu, kamu bayar setelah setuju.",
};

export default function RequestPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Titip Sekarang
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            Titip barang apa saja dari Bandung.
          </h1>
          <p className="mt-4 text-base text-[hsl(var(--muted-foreground))]">
            Tempel link atau tulis nama barangnya. Tim kami cek stok & harga asli, lalu kirim
            penawaran ke WhatsApp — kamu baru bayar setelah setuju. Cari barang populer?{" "}
            <Link href="/katalog" className="underline">Lihat katalog</Link>.
          </p>
        </div>
        <div className="mt-10">
          <RequestFlow />
        </div>
      </div>
    </section>
  );
}
