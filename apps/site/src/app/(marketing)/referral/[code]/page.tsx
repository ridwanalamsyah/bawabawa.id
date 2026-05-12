import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gift, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type Params = { code: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Dapat diskon Rp 25.000 pakai kode ${code.toUpperCase()}`,
    description: `Daftar Bawabawa.id pakai kode referral ${code.toUpperCase()} dan dapat diskon Rp 25.000 untuk titip pertama dari Bandung ke Samarinda.`,
    alternates: { canonical: `/referral/${code}` },
  };
}

export default async function ReferralPage({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  const normalized = code.toUpperCase();

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="relative rounded-3xl border border-[hsl(var(--border))] bg-linear-to-br from-[hsl(var(--sage-100))] to-[hsl(var(--cream-100))] dark:from-[hsl(var(--sage-900))] dark:to-[hsl(var(--bg-soft))] backdrop-blur p-8 sm:p-10 overflow-hidden">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[hsl(var(--sage-500)/0.18)] blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[hsl(var(--emerald-500)/0.15)] blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.8)] backdrop-blur px-3 py-1 text-xs font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-200))]">
            <Sparkles className="h-3.5 w-3.5" />
            Kode referral aktif
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Selamat! Kamu dapat{" "}
            <span className="bg-linear-to-br from-[hsl(var(--sage-700))] via-[hsl(var(--olive-500))] to-[hsl(var(--emerald-600))] bg-clip-text text-transparent">
              diskon Rp 25.000
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-[hsl(var(--muted-foreground))] leading-relaxed">
            Kode <strong className="text-[hsl(var(--foreground))]">{normalized}</strong>{" "}
            otomatis terpasang saat kamu request titip pertama. Berlaku untuk
            transaksi minimum Rp 100.000, tidak bisa digabung dengan promo
            lain.
          </p>

          <div className="mt-7 rounded-2xl border-2 border-dashed border-[hsl(var(--sage-500))] bg-[hsl(var(--surface))] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-medium">
                Kode referral
              </p>
              <p className="font-mono text-2xl font-semibold tracking-wider text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">
                {normalized}
              </p>
            </div>
            <Button asChild size="lg" variant="primary">
              <Link href={`/request?ref=${normalized}`}>
                Klaim diskon sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-[hsl(var(--surface)/0.7)] backdrop-blur-sm p-4 flex items-start gap-3">
              <span className="h-9 w-9 rounded-xl bg-linear-to-br from-[hsl(var(--sage-500))] to-[hsl(var(--sage-700))] text-white grid place-items-center shrink-0">
                <Gift className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">Diskon Rp 25.000</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Otomatis di checkout
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-[hsl(var(--surface)/0.7)] backdrop-blur-sm p-4 flex items-start gap-3">
              <span className="h-9 w-9 rounded-xl bg-linear-to-br from-[hsl(var(--olive-500))] to-[hsl(var(--sage-700))] text-white grid place-items-center shrink-0">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">Untuk teman kamu</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Mereka juga dapat Rp 25.000
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-[hsl(var(--surface)/0.7)] backdrop-blur-sm p-4 flex items-start gap-3">
              <span className="h-9 w-9 rounded-xl bg-linear-to-br from-[hsl(var(--emerald-500))] to-[hsl(var(--sage-600))] text-white grid place-items-center shrink-0">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">Min. order Rp 100rb</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Berlaku 30 hari sejak daftar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
