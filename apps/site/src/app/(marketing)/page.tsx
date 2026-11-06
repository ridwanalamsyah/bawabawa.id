import { Hero, CalculatorWithStickers } from "@/components/marketing/hero";
import { ViralShowcase } from "@/components/marketing/viral-showcase";
import { PromotionBanner } from "@/components/marketing/promotion-banner";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { TripPreview } from "@/components/marketing/trip-preview";
import { Reviews } from "@/components/marketing/reviews";
import { Faq } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/cta";
import { erpSafe } from "@/lib/erp-client";
import type { CatalogProduct } from "@/app/api/catalog/route";
import { VIRAL_BANDUNG_CATALOG } from "@/lib/viral-bandung-data";
import { getHubSamarindaStock } from "@/lib/site-content";
import { CartBar } from "./katalog/catalog-client";

export default async function HomePage() {
  const [catalogRes, hubStock] = await Promise.all([
    erpSafe<CatalogProduct[]>({
      path: "/catalog",
      timeoutMs: 4000,
      cache: "force-cache",
      next: { revalidate: 60, tags: ["catalog", "inventory"] },
    }),
    getHubSamarindaStock(),
  ]);

  const products: CatalogProduct[] =
    catalogRes.ok && Array.isArray(catalogRes.data) && catalogRes.data.length > 0
      ? catalogRes.data
      : VIRAL_BANDUNG_CATALOG;

  return (
    <>
      <PromotionBanner />
      <Hero />
      <section aria-label="Hitung perkiraan biaya" className="lg:hidden mx-auto max-w-6xl px-4 sm:px-6 pt-6 pb-4">
        <CalculatorWithStickers />
      </section>
      <ViralShowcase products={products} hubStock={hubStock} />
      <HowItWorks />
      <TripPreview />
      <Reviews />
      <Faq />
      <FinalCTA />
      <CartBar />
    </>
  );
}
