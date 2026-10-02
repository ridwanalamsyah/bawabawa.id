import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Params = { code: string };

function normalize(code: string): string {
  return code.replace(/[^A-Za-z0-9-]/g, "").slice(0, 32).toUpperCase();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Undangan dari ${normalize(code)}`,
    description: "Titip barang dari Bandung ke Samarinda bersama Bawabawa.id.",
    robots: { index: false, follow: false },
  };
}

/**
 * Referral landing. There is no automated referral reward yet, so this page
 * must not promise one: it records who invited the visitor (shown in the
 * order notes) and points to the normal ordering flow. The old version
 * told *any* code typed into the URL "Selamat! Kamu dapat diskon Rp25.000".
 */
export default async function ReferralPage({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  const normalized = normalize(code);

  return (
    <article className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-sm font-medium text-[hsl(var(--sage-700))] dark:text-[hsl(var(--sage-300))]">Undangan</p>
      <h1 className="mt-3 text-3xl sm:text-4xl leading-tight">Kamu diajak titip barang dari Bandung.</h1>
      <p className="mt-4 text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">
        Tulis kode <strong className="font-mono text-[hsl(var(--foreground))]">{normalized}</strong> di kolom
        &ldquo;Pesan untuk tim&rdquo; saat mengirim request. Kalau sedang ada promo untuk pengguna baru, tim kami
        akan memasukkannya ke penawaran harga.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg">
          <Link href="/request">
            Titip barang <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/afiliasi">Tentang program afiliasi</Link>
        </Button>
      </div>
    </article>
  );
}
