import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { WebVitalsReporter } from "@/components/web-vitals";
import { ErrorReporter } from "@/components/error-reporter";
import { jsonLd, organizationSchema, localBusinessSchema } from "@/lib/seo/schema";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bawabawa.id — Jasa Titip Premium Bandung ke Samarinda",
    template: "%s · Bawabawa.id",
  },
  description:
    "Jasa titip modern dari Bandung ke Samarinda. Personal shopper terverifikasi, tracking realtime, pengiriman aman door-to-door.",
  keywords: [
    "jasa titip Bandung Samarinda",
    "jastip Bandung",
    "personal shopper Bandung",
    "Bawabawa",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://bawabawa.id"),
  openGraph: {
    title: "Bawabawa.id — Jasa Titip Premium Bandung ke Samarinda",
    description:
      "Personal shopper terverifikasi, tracking realtime, pengiriman aman door-to-door.",
    type: "website",
    locale: "id_ID",
  },
};

// Inline theme init mirrors apps/web's bb_themeMode storage so a user toggling
// dark mode in either surface keeps the same preference across the ERP and the
// public site.
const themeInit = `
(function() {
  try {
    var stored = localStorage.getItem('bb_themeMode') || localStorage.getItem('bawabawa-theme') || 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || (stored === 'system' && prefersDark);
    var mode = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    if (dark) document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = mode;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${playfair.variable} ${mono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen flex flex-col">
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
