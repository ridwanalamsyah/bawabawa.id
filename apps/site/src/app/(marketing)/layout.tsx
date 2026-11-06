import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/footer";
import { WhatsAppFloat } from "@/components/marketing/whatsapp-float";
import { StickyMobileCTA } from "@/components/marketing/sticky-cta";
import { RouteProgress } from "@/components/marketing/route-progress";
import { RevealObserver } from "@/components/marketing/reveal-observer";
import { getSiteMotion } from "@/lib/site-motion";
import { getLiveShopperStatus } from "@/lib/site-content";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [motion, liveStatus] = await Promise.all([
    getSiteMotion(),
    getLiveShopperStatus(),
  ]);
  return (
    <div className="contents" data-motion={motion.animations ? "on" : "off"}>
      <RouteProgress />
      <MarketingNav liveStatus={liveStatus} />
      <main id="main" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
      <StickyMobileCTA />
      <RevealObserver />
    </div>
  );
}
