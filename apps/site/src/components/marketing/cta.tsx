import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function FinalCTA() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[hsl(var(--sage-800))] px-6 py-10 sm:px-10 sm:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Siap titip barang dari Bandung hari ini?
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Pilih dari katalog atau tulis pesananmu sendiri — bayar mudah via Transfer Bank &amp; QRIS.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button asChild size="default" variant="accent">
              <Link href="/request" className="font-semibold">
                Titip Sekarang <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="default"
              variant="outline"
              className="bg-transparent text-white border-white/30 hover:bg-white/10"
            >
              <Link href="/katalog">Buka Katalog</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
