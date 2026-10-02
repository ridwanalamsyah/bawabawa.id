import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OngkirCalculator } from "./ongkir-calculator";

/**
 * Plain, specific hero: what we do, how money works, and a calculator that
 * answers the first real question ("berapa?"). No gradient text, no
 * floating mock-ups, no zero-value counters.
 */
export function Hero() {
  return (
    <section className="border-b border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <div className="lg:col-span-7">
          <p className="text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            Jasa titip Bandung → Samarinda
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05]">
            Barang dari Bandung, dibelikan dan dikirim ke rumahmu di Samarinda.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
            Kirim link atau nama barangnya. Kami cek stok dan harga di toko, kirim penawaran lewat
            WhatsApp, lalu belikan setelah kamu setuju dan bayar.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/request">Titip barang</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/katalog">Lihat katalog</Link>
            </Button>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 max-w-lg text-sm">
            <div>
              <dt className="text-[hsl(var(--muted-foreground))]">Ongkir</dt>
              <dd className="mt-1 font-semibold">Rp43rb/kg</dd>
            </div>
            <div>
              <dt className="text-[hsl(var(--muted-foreground))]">Jasa titip</dt>
              <dd className="mt-1 font-semibold">8%, min. Rp20rb</dd>
            </div>
            <div>
              <dt className="text-[hsl(var(--muted-foreground))]">Bayar</dt>
              <dd className="mt-1 font-semibold">Setelah setuju</dd>
            </div>
          </dl>
        </div>
        <div className="lg:col-span-5">
          <OngkirCalculator />
        </div>
      </div>
    </section>
  );
}
