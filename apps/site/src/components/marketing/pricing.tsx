import Link from "next/link";
import { delay } from "@/lib/motion";

export function Pricing() {
  return (
    <section className="py-16 sm:py-20 border-t border-[hsl(var(--border))]" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div data-reveal className="lg:col-span-4">
          <h2 id="pricing-title" className="text-2xl sm:text-3xl font-bold">
            Tarif &amp; jalur kirim
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">
            Total = harga barang di toko Bandung + jasa titip + ongkir sesuai jalur. Tidak ada biaya
            tersembunyi.
          </p>
        </div>
        <div data-reveal style={delay(100)} className="lg:col-span-8 overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <caption className="sr-only">Perbandingan tiga jalur pengiriman Bawabawa.id</caption>
            <thead>
              <tr className="border-b border-[hsl(var(--foreground))]">
                <th scope="col" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]"></th>
                <th scope="col" className="py-3 pr-4">Bandung Instant</th>
                <th scope="col" className="py-3 pr-4">Travel Jabar &amp; JKT</th>
                <th scope="col" className="py-3">
                  Kloter{" "}
                  <Link href="/open-trip" className="font-normal text-sm underline">
                    Hub Samarinda
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))] [&>tr]:transition-colors [&>tr:hover]:bg-[hsl(var(--surface-2)/0.6)]">
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Ongkir</th>
                <td className="py-3 pr-4 tabular-nums">Mulai Rp18.000</td>
                <td className="py-3 pr-4 tabular-nums">Mulai Rp35.000</td>
                <td className="py-3 tabular-nums">Mulai Rp45.000 / kg</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Estimasi tiba</th>
                <td className="py-3 pr-4">Hari ini (2–4 jam)</td>
                <td className="py-3 pr-4">Sameday (4–8 jam via pool)</td>
                <td className="py-3">1–2 hari kerja di Hub Samarinda</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Cakupan</th>
                <td className="py-3 pr-4">Bandung, Cimahi, Lembang, Hotel/Whoosh</td>
                <td className="py-3 pr-4">Jakarta, Bodetabek, Garut, Tasik, Cirebon</td>
                <td className="py-3">Samarinda, Tenggarong, Balikpapan</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 pr-4 font-medium text-[hsl(var(--muted-foreground))]">Jasa titip</th>
                <td className="py-3 pr-4">10% (min. Rp15.000)</td>
                <td className="py-3 pr-4">10% (min. Rp20.000)</td>
                <td className="py-3">12% (min. Rp25.000)</td>
              </tr>
            </tbody>
          </table>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[15px] text-[hsl(var(--muted-foreground))]">
            <li>— Harga barang sesuai struk/harga resmi toko Bandung.</li>
            <li>— Barang habis? Kami ikuti pilihanmu: ganti varian atau batal tanpa biaya.</li>
            <li>— Pembayaran via Transfer BCA/Mandiri/SeaBank atau QRIS.</li>
            <li>— Konfirmasi dan update pengiriman langsung lewat WhatsApp.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
