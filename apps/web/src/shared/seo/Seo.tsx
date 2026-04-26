import { Helmet } from "react-helmet-async";
import { useCms } from "../../features/cms/CmsContext";

export interface SeoProps {
  /**
   * Per-page title fragment. Will be composed as `${title} — ${brand.name}`.
   * Pass `null` to use the brand's default title verbatim.
   */
  title?: string | null;
  description?: string | null;
  ogImage?: string | null;
  /**
   * Canonical URL or path. Falls back to `window.location.href` at runtime.
   */
  canonical?: string | null;
  /**
   * Mark a route as not indexable (e.g. admin / dashboard / login).
   */
  noindex?: boolean;
  /**
   * JSON-LD structured data (Schema.org). Will be injected as
   * `<script type="application/ld+json">`.
   */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function resolveCanonical(canonical?: string | null): string | undefined {
  if (canonical) return canonical;
  if (typeof window === "undefined") return undefined;
  return window.location.origin + window.location.pathname;
}

export function Seo({ title, description, ogImage, canonical, noindex, jsonLd }: SeoProps) {
  const { brand, seo } = useCms();
  const fullTitle = title ? `${title} — ${brand.name}` : seo.defaultTitle || brand.name;
  const finalDescription = description ?? seo.defaultDescription ?? brand.tagline;
  const finalOg = ogImage ?? seo.ogImage ?? null;
  const url = resolveCanonical(canonical);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : <meta name="robots" content="index,follow" />}
      {url ? <link rel="canonical" href={url} /> : null}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={brand.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      {url ? <meta property="og:url" content={url} /> : null}
      {finalOg ? <meta property="og:image" content={finalOg} /> : null}

      {/* Twitter */}
      <meta name="twitter:card" content={seo.twitterCard ?? "summary_large_image"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      {finalOg ? <meta name="twitter:image" content={finalOg} /> : null}

      {/* Theme color sync with brand */}
      <meta name="theme-color" content={brand.primaryColor} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}

/**
 * Site-wide JSON-LD: Organization + WebSite. Mounted once at the app root so
 * crawlers always see it regardless of the active route.
 */
export function SiteJsonLd() {
  const { brand, contact, social } = useCms();
  const origin = typeof window !== "undefined" ? window.location.origin : "https://bawabawa.id";

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: origin,
    logo: brand.logoUrl ?? undefined,
    description: brand.tagline,
    contactPoint: contact?.email
      ? [
          {
            "@type": "ContactPoint",
            email: contact.email,
            telephone: contact.phone || undefined,
            contactType: "customer support",
            availableLanguage: ["id", "en"]
          }
        ]
      : undefined,
    sameAs: social
      ? [social.instagram, social.linkedin, social.twitter, social.youtube].filter(Boolean)
      : []
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: origin
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organization)}</script>
      <script type="application/ld+json">{JSON.stringify(website)}</script>
    </Helmet>
  );
}
