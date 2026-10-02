import type { Metadata } from "next";
import { LacakClient } from "./lacak-client";

export const metadata: Metadata = {
  title: "Lacak pesanan",
  description: "Buka status pesanan jastip Bawabawa.id dari link tracking atau dari perangkat ini.",
};

export default function LacakPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Lacak pesanan</h1>
        <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
          Setiap pesanan punya link tracking pribadi yang kami kirim ke WhatsApp-mu.
          Pesanan yang dibuat dari perangkat ini juga tampil di bawah.
        </p>
        <LacakClient />
      </div>
    </section>
  );
}
