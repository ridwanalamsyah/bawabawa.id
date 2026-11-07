import Link from "next/link";
import { delay } from "@/lib/motion";

export function Pricing() {
  return (
    <section className="py-16 sm:py-20 border-t border-[hsl(var(--border))]" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div data-reveal className="lg:col-span-4">
          <h2 id="pricing-title" className="text-2xl sm:text-3xl">
            Tarif
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Total = harga barang + jasa titip + ongkir. Tidak ada biaya lain. Pembayaran via Transfer
            BCA / Mandiri atau QRIS setelah stok toko dikonfirmasi di WhatsApp.
          </p>
        </div>
        <div data-reveal style={delay(100)} className="lg:col-span-8 overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <caption className="sr-only">Perbandingan layanan pengiriman</caption>
            <thead>
              <tr className="border-b border-[hsl(var(--foreground))]">
                <th scope="col" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]"></th>
                <th scope="col" className="py-3 pr-4">Bandung Instant</th>
                <th scope="col" className="py-3 pr-4">Travel Jabar &amp; JKT</th>
                <th scope="col" className="py-3">
                  Kloter{" "}
                  <Link href="/open-trip" className="font-normal text-sm underline">
                    Samarinda
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))] [&>tr]:transition-colors [&>tr:hover]:bg-[hsl(var(--surface-2)/0.6)]">
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Ongkir</th>
                <td className="py-3 pr-4 tabular-nums">Rp18.000 / kg</td>
                <td className="py-3 pr-4 tabular-nums">Rp35.000 / kg</td>
                <td className="py-3 tabular-nums">Rp45.000 / kg</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Sampai</th>
                <td className="py-3 pr-4">Hari ini (2–4 jam)</td>
                <td className="py-3 pr-4">Sameday (4–8 jam via pool)</td>
                <td className="py-3">1–2 hari kerja di Hub Samarinda</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Wilayah</th>
                <td className="py-3 pr-4">Bandung, Cimahi, Lembang, Hotel</td>
                <td className="py-3 pr-4">Jakarta, Bodetabek, Garut, Tasik, Cirebon</td>
                <td className="py-3">Samarinda, Tenggarong, Balikpapan</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Jasa titip</th>
                <td className="py-3" colSpan={3}>
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
