import { Hero } from "@/components/marketing/hero";
import { PromotionBanner } from "@/components/marketing/promotion-banner";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { TripPreview } from "@/components/marketing/trip-preview";
import { Faq } from "@/components/marketing/faq";

/**
 * Landing page: hero with a working price calculator, how it works, rates
 * (which double as the promises we keep), real Open Trip dates, FAQ.
 */
export default function HomePage() {
  return (
    <>
      <PromotionBanner />
      <Hero />
      <HowItWorks />
      <Pricing />
      <TripPreview />
      <Faq />
    </>
  );
}
