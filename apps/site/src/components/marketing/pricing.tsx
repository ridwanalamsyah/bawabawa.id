import Link from "next/link";
import { formatIDR } from "@/lib/utils";
import { DEFAULT_ZONE_RATES } from "@/lib/viral-bandung-data";

export function Pricing() {
  const zones = DEFAULT_ZONE_RATES;

  return (
    <section
      id="harga"
      className="py-14 sm:py-20 border-t border-[#DDD5C4] bg-[#FAF6EE]"
      aria-labelledby="pricing-title"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4E5346]">
              MATRIKS ONGKIR &amp; JASA TITIP RESMI
            </p>
            <h2
              id="pricing-title"
              className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-[#1C2016]"
            >
              Tarif 3 Jalur Pengiriman
            </h2>
            <p className="mt-1 text-sm text-[#4E5346]">
              Rumus transparan: Harga Asli Toko + Jasa Titip + Ongkir Sesuai Zona.
            </p>
          </div>
          <div className="rounded-md border border-[#C9BFA9] bg-[#FFFDF9] px-3.5 py-2 font-mono text-xs font-semibold text-[#1C2016]">
            Pembayaran: BCA · Mandiri · SeaBank · QRIS Resmi
          </div>
        </div>

        {/* Swiss Spec-Sheet Tariff Matrix (Replaces forbidden 3-card pricing template per R-05) */}
        <div className="border-y border-[#C9BFA9] divide-y divide-[#DDD5C4]">
          {/* Table Header (Desktop) */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#4E5346] bg-[#F2ECDF]/60 px-4">
            <div className="col-span-3">Jalur &amp; Estimasi</div>
            <div className="col-span-4">Cakupan Kota &amp; Armada</div>
            <div className="col-span-2">Ongkir Dasar</div>
            <div className="col-span-2">Jasa Titip</div>
            <div className="col-span-1 text-right">Order</div>
          </div>

          {zones.map((z, idx) => (
            <div
              key={z.id}
              className="py-5 px-2 sm:px-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start lg:items-center hover:bg-[#F2ECDF]/40 transition-colors"
            >
              {/* Col 1: Route & ETA */}
              <div className="lg:col-span-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#4A5828]">
                  JALUR 0{idx + 1}
                </span>
                <h3 className="mt-0.5 text-base font-bold text-[#1C2016]">
                  {z.shortLabel.replace(/^[^\w]+/, "")}
                </h3>
                <p className="mt-0.5 font-mono text-xs text-[#4E5346]">
                  {z.eta}
                </p>
              </div>

              {/* Col 2: Cities & Shuttles */}
              <div className="lg:col-span-4 text-xs text-[#4E5346] space-y-1">
                <p className="font-semibold text-[#1C2016]">
                  {z.cities.slice(0, 5).join(", ")}
                </p>
                {z.shuttles && (
                  <p className="text-[11px] text-[#4E5346]">
                    Armada: {z.shuttles.slice(0, 3).join(" · ")}
                  </p>
                )}
              </div>

              {/* Col 3: Base Shipping */}
              <div className="lg:col-span-2">
                <p className="font-mono text-base font-extrabold text-[#1C2016] tabular-nums">
                  {formatIDR(z.baseShippingRp)}
                </p>
                <p className="font-mono text-[11px] text-[#4E5346] tabular-nums">
                  Termasuk {z.freeKgIncluded} kg pertama (+{formatIDR(z.perKgRp)}/kg)
                </p>
              </div>

              {/* Col 4: Jastip Fee */}
              <div className="lg:col-span-2">
                <p className="font-mono text-sm font-bold text-[#1C2016] tabular-nums">
                  {Math.round(z.jastipFeeRate * 100)}% dari belanja
                </p>
                <p className="font-mono text-[11px] text-[#4E5346] tabular-nums">
                  Min. {formatIDR(z.jastipFeeMinRp)} / nota
                </p>
              </div>

              {/* Col 5: Action */}
              <div className="lg:col-span-1 lg:text-right">
                <Link
                  href={`/request?zone=${z.id}`}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-[#4A5828] px-3.5 text-xs font-semibold text-[#FAF6EE] hover:bg-[#3A461E] transition-colors"
                >
                  Pilih
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
