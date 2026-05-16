import { Hero } from "@/components/marketing/hero";
import { PromotionBanner } from "@/components/marketing/promotion-banner";
import { TrustGrid } from "@/components/marketing/trust";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Categories } from "@/components/marketing/categories";
import { TripPreview } from "@/components/marketing/trip-preview";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { Faq } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/cta";

// LiveFeed + LiveOrderMap were removed from the homepage: both relied on
// hardcoded mock data and made claims ("137 customer online", "Streamed via
// WebSocket · ERP sync ✓") that aren't yet backed by real telemetry. They
// can be re-added once the SSE pipeline at /api/events/stream is wired to
// real order activity.
export default function HomePage() {
  return (
    <>
      <PromotionBanner />
      <Hero />
      <TrustGrid />
      <HowItWorks />
      <TripPreview />
      <Categories />
      <Testimonials />
      <TrustBadges />
      <Faq />
      <FinalCTA />
    </>
  );
}
