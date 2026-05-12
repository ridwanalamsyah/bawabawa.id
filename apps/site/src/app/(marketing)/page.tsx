import { Hero } from "@/components/marketing/hero";
import { LiveFeed } from "@/components/marketing/live-feed";
import { TrustGrid } from "@/components/marketing/trust";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Categories } from "@/components/marketing/categories";
import { TripPreview } from "@/components/marketing/trip-preview";
import { LiveOrderMap } from "@/components/marketing/live-order-map";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { Faq } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <LiveFeed />
      <TrustGrid />
      <HowItWorks />
      <LiveOrderMap />
      <TripPreview />
      <Categories />
      <Testimonials />
      <TrustBadges />
      <Faq />
      <FinalCTA />
    </>
  );
}
