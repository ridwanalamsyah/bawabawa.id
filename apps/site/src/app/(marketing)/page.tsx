import { Hero } from "@/components/marketing/hero";
import { ViralShowcase } from "@/components/marketing/viral-showcase";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { FinalCTA } from "@/components/marketing/cta";
import { erpSafe } from "@/lib/erp-client";
import type { CatalogProduct } from "@/app/api/catalog/route";
import {
  VIRAL_BANDUNG_CATALOG,
  DEFAULT_HUB_SAMARINDA_STOCK,
  type HubSamarindaStockItem,
} from "@/lib/viral-bandung-data";

export default async function HomePage() {
  const [catalogRes, hubRes] = await Promise.all([
    erpSafe<CatalogProduct[]>({
      path: "/catalog",
      timeoutMs: 3500,
      cache: "force-cache",
      next: { revalidate: 60, tags: ["inventory", "catalog"] },
    }),
    erpSafe<{ value?: HubSamarindaStockItem[] }>({
      path: "/admin/settings/hub_samarinda_stock",
      timeoutMs: 2500,
      cache: "force-cache",
      next: { revalidate: 60, tags: ["settings"] },
    }),
  ]);

  const products: CatalogProduct[] =
    catalogRes.ok && Array.isArray(catalogRes.data) && catalogRes.data.length > 0
      ? catalogRes.data
      : VIRAL_BANDUNG_CATALOG;

  const hubStock: HubSamarindaStockItem[] =
    hubRes.ok && Array.isArray(hubRes.data?.value) && hubRes.data.value.length > 0
      ? hubRes.data.value
      : DEFAULT_HUB_SAMARINDA_STOCK;

  return (
    <>
      <Hero />
      <ViralShowcase products={products} hubStock={hubStock} />
      <HowItWorks />
      <Pricing />
      <FinalCTA />
    </>
  );
}
