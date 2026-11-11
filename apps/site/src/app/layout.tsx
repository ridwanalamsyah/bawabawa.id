import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { WebVitalsReporter } from "@/components/web-vitals";
import { ErrorReporter } from "@/components/error-reporter";
import { jsonLd, organizationSchema, localBusinessSchema } from "@/lib/seo/schema";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

export const metadata: Metadata = {
  title: {
    default: "Bawabawa.id: Jastip Kuliner & Barang Viral Bandung (Bandung, Jabar/Travel, Hub Samarinda)",
    template: "%s · Bawabawa.id",
  },
  description:
    "Jasa titip kuliner & barang viral Bandung (Roti Macan, Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Makjay, In Parfume). Kirim Instant Bandung Raya, Sameday Travel Jawa Barat & Jakarta, atau Kloter ke Hub Samarinda.",
  keywords: [
    "jastip Bandung",
    "jastip Roti Macan Bandung",
    "jastip Tjilaki 9",
    "jastip Bandung Jakarta travel",
    "jastip Bandung Samarinda",
    "Bawabawa.id",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://bawabawa.id"),
  openGraph: {
    title: "Bawabawa.id: Jastip Kuliner & Barang Viral Bandung",
    description:
      "Titip Roti Macan, Bolu Pisang Tjilaki 9, Roti Merak, Rochi, Studio Bolen, Makjay & In Parfume. Kirim Bandung Instant, Travel Jabar/Jakarta, atau Hub Samarinda.",
    type: "website",
    locale: "id_ID",
  },
};

// Always initialize in clean warm light mode (#FCF3E4) so the brand palette stays
// bright and appetizing across devices.
const themeInit = `
(function() {
  try {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className="antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[hsl(var(--sage-700))] focus:px-4 focus:py-2 focus:text-white"
        >
          Lewati ke konten utama
        </a>
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme="system"
          toastOptions={{
            classNames: {
              toast:
                "!bg-[hsl(var(--surface))] !border-[hsl(var(--border))] !text-[hsl(var(--foreground))] !shadow-lg !backdrop-blur-md",
            },
          }}
        />
        <WebVitalsReporter />
        <ErrorReporter />
        {PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src={PLAUSIBLE_SRC}
            strategy="afterInteractive"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(
            organizationSchema(
              process.env.NEXT_PUBLIC_SITE_URL ?? "https://bawabawa.id"
            )
          )}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(
            localBusinessSchema(
              process.env.NEXT_PUBLIC_SITE_URL ?? "https://bawabawa.id"
            )
          )}
        />
      </body>
    </html>
  );
}
