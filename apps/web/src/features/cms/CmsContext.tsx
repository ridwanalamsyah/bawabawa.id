import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  fetchPublicNavItems,
  fetchPublicSettings,
  type BrandSettings,
  type ContactSettings,
  type FeatureFlags,
  type NavItem,
  type SeoSettings,
  type SocialSettings,
  type SiteSetting
} from "../../shared/api/cms";
import { brand as fallbackBrand } from "../../design-system/brand";

const DEFAULT_BRAND: BrandSettings = {
  name: fallbackBrand.name,
  shortName: fallbackBrand.name,
  tagline: fallbackBrand.tagline,
  monogram: fallbackBrand.monogram,
  logoUrl: null,
  primaryColor: "#6366f1",
  accentColor: "#8b5cf6"
};

const DEFAULT_SEO: SeoSettings = {
  defaultTitle: "bawabawa.id — Enterprise Resource Planning",
  defaultDescription:
    "Platform ERP modular untuk operasi sales, finance, inventory, procurement, dan HR di satu kanvas.",
  ogImage: null,
  twitterCard: "summary_large_image"
};

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableDarkMode: true,
  enableMobileMenu: true,
  showWelcomeToast: true
};

const FALLBACK_NAV: NavItem[] = [
  { id: "fallback-dashboard", label: "Dashboard", href: "/", parentId: null, requiredPermission: null, requiredRole: null, sortOrder: 10, isExternal: false, isActive: true },
  { id: "fallback-sales", label: "Sales", href: "/sales", parentId: null, requiredPermission: null, requiredRole: null, sortOrder: 20, isExternal: false, isActive: true },
  { id: "fallback-orders", label: "Orders", href: "/orders", parentId: null, requiredPermission: "orders:read", requiredRole: null, sortOrder: 30, isExternal: false, isActive: true },
  { id: "fallback-inventory", label: "Inventory", href: "/inventory", parentId: null, requiredPermission: null, requiredRole: null, sortOrder: 40, isExternal: false, isActive: true },
  { id: "fallback-procurement", label: "Procurement", href: "/procurement", parentId: null, requiredPermission: null, requiredRole: null, sortOrder: 50, isExternal: false, isActive: true },
  { id: "fallback-finance", label: "Finance", href: "/finance", parentId: null, requiredPermission: "finance:manage_finance", requiredRole: null, sortOrder: 60, isExternal: false, isActive: true },
  { id: "fallback-crm", label: "CRM", href: "/crm", parentId: null, requiredPermission: null, requiredRole: null, sortOrder: 70, isExternal: false, isActive: true },
  { id: "fallback-hr", label: "HR", href: "/hr", parentId: null, requiredPermission: null, requiredRole: null, sortOrder: 80, isExternal: false, isActive: true },
  { id: "fallback-admin", label: "Admin", href: "/admin", parentId: null, requiredPermission: "users:manage_users", requiredRole: null, sortOrder: 90, isExternal: false, isActive: true }
];

export interface CmsState {
  brand: BrandSettings;
  contact: ContactSettings | null;
  social: SocialSettings | null;
  seo: SeoSettings;
  featureFlags: FeatureFlags;
  navItems: NavItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CmsContext = createContext<CmsState | null>(null);

function pickSetting<V>(settings: SiteSetting[], key: string, fallback: V): V {
  const found = settings.find((s) => s.key === key);
  if (!found || found.value === null || found.value === undefined) return fallback;
  return found.value as V;
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [contact, setContact] = useState<ContactSettings | null>(null);
  const [social, setSocial] = useState<SocialSettings | null>(null);
  const [seo, setSeo] = useState<SeoSettings>(DEFAULT_SEO);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [navItems, setNavItems] = useState<NavItem[]>(FALLBACK_NAV);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [settings, nav] = await Promise.all([
        fetchPublicSettings().catch(() => [] as SiteSetting[]),
        fetchPublicNavItems().catch(() => [] as NavItem[])
      ]);

      setBrand(pickSetting(settings, "brand", DEFAULT_BRAND));
      setContact(pickSetting<ContactSettings | null>(settings, "contact", null));
      setSocial(pickSetting<SocialSettings | null>(settings, "social", null));
      setSeo(pickSetting(settings, "seo", DEFAULT_SEO));
      setFeatureFlags(pickSetting(settings, "feature_flags", DEFAULT_FEATURE_FLAGS));
      if (nav.length > 0) {
        setNavItems(nav);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Gagal memuat konfigurasi situs";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Apply runtime brand colors so the design tokens stay in sync with admin
  // edits (brand.primaryColor / accentColor → --brand-accent / --brand-accent-2).
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-accent", brand.primaryColor);
    root.style.setProperty("--brand-accent-2", brand.accentColor);
    root.style.setProperty(
      "--brand-gradient",
      `linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.accentColor} 100%)`
    );
  }, [brand.primaryColor, brand.accentColor]);

  // Update document title to match seo.defaultTitle.
  useEffect(() => {
    if (seo.defaultTitle) document.title = seo.defaultTitle;
  }, [seo.defaultTitle]);

  const value = useMemo<CmsState>(
    () => ({ brand, contact, social, seo, featureFlags, navItems, isLoading, error, refresh }),
    [brand, contact, social, seo, featureFlags, navItems, isLoading, error, refresh]
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms(): CmsState {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error("useCms() must be used inside <CmsProvider>");
  }
  return ctx;
}

export function useBrand(): BrandSettings {
  return useCms().brand;
}

export function useNavItems(): NavItem[] {
  return useCms().navItems;
}

export function useFeatureFlags(): FeatureFlags {
  return useCms().featureFlags;
}
