import type { Metadata } from "next";
import { CategoryLanding } from "@/components/marketing/category-landing";
import { CATEGORY_PAGES } from "@/lib/seo/categories";
import { jsonLd, serviceSchema, breadcrumbSchema } from "@/lib/seo/schema";

const SLUG = "jastip-skincare";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bawabawa.id";
const page = CATEGORY_PAGES[SLUG];

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: `/${SLUG}` },
  openGraph: { title: page.metaTitle, description: page.metaDescription, type: "website" },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(serviceSchema(SITE))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbSchema(
            [
              { name: "Beranda", url: "/" },
              { name: page.title, url: `/${SLUG}` },
            ],
            SITE
          )
        )}
      />
      <CategoryLanding page={page} />
    </>
  );
}
