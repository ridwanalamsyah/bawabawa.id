import Link from "next/link";
import { KILAT } from "@/lib/pricing";
import { formatIDR } from "@/lib/utils";

/**
 * Rates written out in full — the honest version of a "trust" section.
 * Numbers must match lib/pricing.ts.
 */
export function Pricing() {
  return (
    <section className="py-16 sm:py-20 border-t border-[hsl(var(--border))]" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <h2 id="pricing-title" className="text-2xl sm:text-3xl">
            Tarif
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Total = harga barang + jasa titip + ongkir. Tidak ada biaya lain. Formulir kami otomatis
            memilih pengiriman yang lebih hemat untuk berat barangmu.
          </p>
        </div>
        <div className="lg:col-span-8 overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <caption className="sr-only">Perbandingan layanan pengiriman</caption>
            <thead>
              <tr className="border-b border-[hsl(var(--foreground))]">
                <th scope="col" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]"></th>
                <th scope="col" className="py-3 pr-4">Reguler</th>
                <th scope="col" className="py-3 pr-4">
                  Kargo{" "}
                  <Link href="/open-trip" className="font-normal text-sm underline">
                    Open Trip
                  </Link>
                </th>
                {KILAT && (
                  <th scope="col" className="py-3">
                    Kilat
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Ongkir</th>
                <td className="py-3 pr-4 tabular-nums">Rp43.000 / kg</td>
                <td className="py-3 pr-4 tabular-nums">Rp200.000 flat sampai 50 kg</td>
                {KILAT && (
                  <td className="py-3 tabular-nums">
                    {formatIDR(KILAT.perKg)} / kg{KILAT.minKg > 0.5 ? `, min. ${KILAT.minKg} kg` : ""}
                  </td>
                )}
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Sampai</th>
                <td className="py-3 pr-4">3–4 hari kerja</td>
                <td className="py-3 pr-4">±10 hari kerja, ikut jadwal trip</td>
                {KILAT && <td className="py-3">1–2 hari kerja (pesawat via Balikpapan)</td>}
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Cocok untuk</th>
                <td className="py-3 pr-4">Di bawah ±5 kg, butuh cepat</td>
                <td className="py-3 pr-4">Belanja banyak / barang berat</td>
                {KILAT && <td className="py-3">Kecil &amp; mendesak, tanpa baterai/aerosol</td>}
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Jasa titip</th>
                <td className="py-3" colSpan={KILAT ? 3 : 2}>
                  8% dari harga barang, minimal Rp20.000
                </td>
              </tr>
            </tbody>
          </table>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[15px]">
            <li>— Tidak dibelikan di atas batas hargamu tanpa persetujuan.</li>
            <li>— Barang habis? Kami ikuti pilihanmu: tanya, ganti varian, atau refund.</li>
            <li>— Berat ditimbang ulang; selisih ongkir diinfokan sebelum kirim.</li>
            <li>— Semua update masuk WhatsApp dan link tracking pribadi.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
