import { MarketingNav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/footer";
import { WhatsAppFloat } from "@/components/marketing/whatsapp-float";
import { StickyMobileCTA } from "@/components/marketing/sticky-cta";
import { RouteProgress } from "@/components/marketing/route-progress";
import { RevealObserver } from "@/components/marketing/reveal-observer";

/**
 * One floating element at a time: the WhatsApp button on desktop, the
 * sticky "Titip" bar (which also carries a WhatsApp shortcut) on mobile.
 * The top promo banner and the cookie banner were removed — promotions
 * show only when a public voucher exists (PromotionBanner on the home
 * page), and the site sets no non-essential cookies (Plausible is
 * cookieless), so there is nothing to consent to.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteProgress />
      <MarketingNav />
      <main id="main" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
      <StickyMobileCTA />
      <RevealObserver />
    </>
  );
}
