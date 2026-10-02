import Link from "next/link";
import { ArrowRight, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import type { CategoryPage } from "@/lib/seo/categories";

export function CategoryLanding({ page }: { page: CategoryPage }) {
  return (
    <>
      <section className="border-b border-[hsl(var(--border))]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
            {page.heroEyebrow}
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl leading-tight max-w-3xl">{page.heroHeadline}</h1>
          <p className="mt-5 max-w-2xl text-lg text-[hsl(var(--muted-foreground))] leading-relaxed">
            {page.heroDescription}
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" variant="primary">
              <Link href={`/request?cat=${page.slug}`}>
                Titip {page.title.toLowerCase()} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/katalog">Lihat katalog</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
              Contoh barang
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Brand & produk populer</h2>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {page.examples.map((ex) => (
                <div
                  key={ex}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2.5 flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--sage-500))]" />
                  <span className="text-sm font-medium">{ex}</span>
                </div>
              ))}
            </div>
          </div>

          <GlassCard className="p-6">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))] font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Komitmen Bawabawa
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Dibelikan langsung di toko yang kamu pilih",
                "Harga final dikirim dulu — bayar setelah setuju",
                "Tidak melebihi batas harga tanpa persetujuanmu",
                "Link tracking + update status via WhatsApp",
                "Refund kalau barang tidak tersedia",
                "Tarif terbuka: jasa 8% + ongkir sesuai berat",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--sage-700))] text-white shrink-0">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-[hsl(var(--foreground))]">{line}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Pertanyaan {page.title}</h2>
        <div className="mt-5 space-y-3">
          {page.faq.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 [&[open]>summary>span.toggle]:rotate-45 [&[open]>summary>span.toggle]:bg-[hsl(var(--sage-700))] [&[open]>summary>span.toggle]:text-white"
            >
              <summary className="cursor-pointer list-none flex items-start justify-between gap-3 font-medium">
                {f.q}
                <span className="toggle inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] transition-all">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href={`/request?cat=${page.slug}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-br from-[hsl(var(--sage-600))] to-[hsl(var(--sage-800))] text-white px-6 py-3 font-semibold shadow-md hover:shadow-lg transition-shadow"
          >
            Mulai titip {page.title.toLowerCase()}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
