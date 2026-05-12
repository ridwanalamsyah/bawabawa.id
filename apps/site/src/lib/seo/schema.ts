/**
 * JSON-LD schema.org helpers for Bawabawa.id. The output of each function is
 * serialised into a <script type="application/ld+json"> tag so Google can
 * render rich snippets (FAQ accordion, organisation, breadcrumb, etc).
 */

export type FaqItem = { question: string; answer: string };

export function localBusinessSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Bawabawa.id",
    description:
      "Jasa titip premium Bandung ke Samarinda. Personal shopper terverifikasi, tracking realtime, pengiriman aman door-to-door.",
    url: siteUrl,
    logo: `${siteUrl}/og.png`,
    image: `${siteUrl}/og.png`,
    priceRange: "Rp 30.000 – Rp 250.000 / kg",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bandung",
      addressRegion: "Jawa Barat",
      addressCountry: "ID",
    },
    areaServed: [
      { "@type": "City", name: "Bandung" },
      { "@type": "City", name: "Samarinda" },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.96",
      reviewCount: "1247",
      bestRating: "5",
      worstRating: "1",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["id-ID"],
    },
  } as const;
}

export function organizationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bawabawa.id",
    url: siteUrl,
    logo: `${siteUrl}/og.png`,
    sameAs: [
      "https://instagram.com/bawabawa.id",
      "https://tiktok.com/@bawabawa.id",
    ],
  } as const;
}

export function faqPageSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.answer,
      },
    })),
  } as const;
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
  siteUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${siteUrl}${it.url}`,
    })),
  } as const;
}

export function serviceSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Personal Shopper & Jasa Titip",
    provider: { "@type": "Organization", name: "Bawabawa.id", url: siteUrl },
    areaServed: [
      { "@type": "City", name: "Bandung" },
      { "@type": "City", name: "Samarinda" },
    ],
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      price: "30000",
      description: "Jasa titip per kilogram, mulai Rp 30.000/kg",
    },
  } as const;
}

export function jsonLd(data: object) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}
