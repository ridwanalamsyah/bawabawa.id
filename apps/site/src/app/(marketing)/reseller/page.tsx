import type { Metadata } from "next";
import { PartnerForm } from "./partner-form";

export const metadata: Metadata = {
  title: "Reseller & B2B — Bawabawa.id",
  description:
    "Belanja rutin dari Bandung untuk toko atau usaha di Samarinda. Daftar reseller, kulakan B2B, atau afiliasi Bawabawa.id.",
  alternates: { canonical: "/reseller" },
};

const KINDS = ["reseller", "b2b", "affiliate"] as const;
type Kind = (typeof KINDS)[number];

export default async function ResellerPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const initialKind: Kind = KINDS.includes(kind as Kind) ? (kind as Kind) : "reseller";

  return (
    <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,28rem)]">
        <div>
          <h1 className="text-3xl sm:text-4xl">Belanja rutin dari Bandung untuk usahamu</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Punya toko, olshop, atau usaha di Samarinda yang butuh barang dari Bandung tiap bulan? Kami belanjakan,
            gabungkan, dan kirim dalam satu kiriman kargo supaya ongkir per barang jauh lebih murah.
          </p>

          <dl className="mt-8 space-y-6">
            <div>
              <dt className="font-semibold">Reseller</dt>
              <dd className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                Untuk yang jual lagi barang Bandung (fashion, sepatu, skincare, makanan). Jadwal belanja tetap tiap
                Open Trip, harga jasa khusus untuk volume rutin, dan foto produk dari toko untuk bahan jualanmu.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">B2B / kulakan</dt>
              <dd className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                Untuk usaha yang butuh bahan atau stok dalam jumlah besar: kami cari supplier, minta penawaran, cek
                barang sebelum dikirim, dan kirim pakai kargo. Bisa dengan invoice untuk pembukuan.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Afiliasi</dt>
              <dd className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                Untuk kreator dan komunitas: bagikan kode referral, dapat komisi dari setiap pesanan yang memakai
                kodemu. Tanpa modal, tanpa stok.
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-sm text-[hsl(var(--muted-foreground))]">
            Setelah form dikirim, tim kami menghubungi lewat WhatsApp dalam 1×24 jam kerja untuk membahas kebutuhan
            dan tarif.
          </p>
        </div>

        <PartnerForm initialKind={initialKind} />
      </div>
    </article>
  );
}
