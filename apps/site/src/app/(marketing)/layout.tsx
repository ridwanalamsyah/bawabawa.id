import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/footer";
import { WhatsAppFloat } from "@/components/marketing/whatsapp-float";
import { StickyMobileCTA } from "@/components/marketing/sticky-cta";
import { CookieConsent } from "@/components/marketing/cookie-consent";
import { RouteProgress } from "@/components/marketing/route-progress";
import { PromoBanner } from "@/components/marketing/promo-banner";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteProgress />
      <PromoBanner />
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <StickyMobileCTA />
      <CookieConsent />
    </>
  );
}
