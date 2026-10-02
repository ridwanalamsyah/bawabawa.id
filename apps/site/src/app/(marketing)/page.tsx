import { Hero } from "@/components/marketing/hero";
import { PromotionBanner } from "@/components/marketing/promotion-banner";
import { TrustGrid } from "@/components/marketing/trust";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { TripPreview } from "@/components/marketing/trip-preview";
import { Faq } from "@/components/marketing/faq";

/**
 * Landing page, trimmed to one job: get a visitor to "Titip sekarang" or
 * the catalog. Removed sections: Categories (lives in the footer + landing
 * pages), Testimonials (empty until real reviews exist), TrustBadges
 * (listed payment partners that aren't live), and FinalCTA (loaded a 3D
 * model for a decorative map). The hero and sticky CTA already carry the
 * call to action.
 */
export default function HomePage() {
  return (
    <>
      <PromotionBanner />
      <Hero />
      <HowItWorks />
      <TripPreview />
      <TrustGrid />
      <Faq />
    </>
  );
}
