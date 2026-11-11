import Link from "next/link";
import { OngkirCalculator } from "./ongkir-calculator";
import { HeroQuickSearch } from "./hero-quick-search";

export function CalculatorWithStickers() {
  return <OngkirCalculator />;
}

const HERO_LOOKBOOK_PEEK = [
  {
    name: "Roti Macan Sourdough",
    store: "Buah Batu · Batch 08:00",
    image: "/images/catalog/roti-macan.jpg",
    href: "/request?item=Roti+Macan+Bandung&store=Roti+Macan+Buah+Batu",
  },
  {
    name: "Bolu Pisang Tjilaki 9",
    store: "Cihapit · Batch 09:00",
    image: "/images/catalog/bolu-pisang-tjilaki.jpg",
    href: "/request?item=Bolu+Pisang+Tjilaki+9&store=Tjilaki+9+Cihapit",
  },
  {
    name: "Rochi Roti Mochi",
    store: "Jl. Riau 61 · Batch 10:00",
    image: "/images/catalog/rochi-mochi.jpg",
    href: "/request?item=Rochi+Roti+Mochi&store=Rochi+Jl.+Riau+61",
  },
  {
    name: "Studio Bolen Artisan",
    store: "Trunojoyo · Batch 09:30",
    image: "/images/catalog/studio-bolen.jpg",
    href: "/request?item=Studio+Bolen+Bandung&store=Studio+Bolen+Trunojoyo",
  },
];

export async function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#DDD5C4] bg-[#FAF6EE]">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-14 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column (7 Cols) - No pill badge above H1 per R-09 */}
          <div className="lg:col-span-7 space-y-6 pt-1">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#1C2016]">
              Titip Kuliner &amp; Barang Hits Bandung.
            </h1>

            <p className="max-w-[58ch] text-base sm:text-[17px] leading-[1.6] text-[#4E5346]">
              Dari Roti Macan, Tjilaki 9, hingga Kopi Makjay. Kirim Instant Bandung, Sameday Travel Jabar &amp; Jakarta, atau Kloter ke Samarinda.
            </p>

            <HeroQuickSearch />
          </div>

          {/* Right Column (5 Cols): Bakehouse Thermal Receipt Calculator */}
          <div className="lg:col-span-5">
            <OngkirCalculator />
          </div>
        </div>

        {/* Above-the-fold Editorial Culinary Lookbook Strip (matches konsep_hero_bawabawa_1794410176220.jpg) */}
        <div className="mt-10 pt-6 border-t border-[#DDD5C4]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {HERO_LOOKBOOK_PEEK.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group block space-y-2"
              >
                <div className="overflow-hidden rounded-md border border-[#DDD5C4] bg-[#F2ECDF] aspect-[16/10]">
                  <img
                    src={item.image}
                    alt={item.name}
                    width={400}
                    height={250}
                    fetchPriority="high"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-bold text-[#1C2016] group-hover:text-[#4A5828] truncate">
                    {item.name}
                  </p>
                  <span className="font-mono text-[10px] text-[#4E5346] shrink-0">
                    {item.store}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
