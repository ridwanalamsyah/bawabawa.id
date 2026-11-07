import { Hero, CalculatorWithStickers } from "@/components/marketing/hero";
import { QuickActions } from "@/components/marketing/quick-actions";
import { CategoryGrid } from "@/components/marketing/category-grid";
import { PromotionBanner } from "@/components/marketing/promotion-banner";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { TripPreview } from "@/components/marketing/trip-preview";
import { Reviews } from "@/components/marketing/reviews";
import { Faq } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/cta";

export default function HomePage() {
  return (
    <>
      <PromotionBanner />
      <Hero />
      <QuickActions />
      <section aria-label="Hitung perkiraan biaya" className="lg:hidden mx-auto max-w-6xl px-4 sm:px-6 pt-4 pb-10">
        <CalculatorWithStickers />
      </section>
      <CategoryGrid />
      <HowItWorks />
      <Pricing />
      <TripPreview />
      <Reviews />
      <Faq />
      <FinalCTA />
    </>
  );
}
