import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
  metadataBase: new URL("https://bawabawa.id"),
  openGraph: {
    title: "Bawabawa.id — Jasa Titip Premium Bandung ke Samarinda",
    description:
      "Personal shopper terverifikasi, tracking realtime, pengiriman aman door-to-door.",
    type: "website",
    locale: "id_ID",
  },
};

const themeInit = `
(function() {
  try {
    var t = localStorage.getItem('bawabawa-theme') || 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = t === 'dark' || (t === 'system' && prefersDark);
    if (dark) document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
