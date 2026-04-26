/**
 * Compile-time fallback brand identity. Used only on the very first render
 * before the CMS context resolves, or when the CMS settings API is unreachable.
 * Live values flow through `useBrand()` from `features/cms/CmsContext`.
 */
export const brand = {
  name: "bawabawa.id",
  monogram: "BW",
  tagline: "Sistem Manajemen Bisnis Terpadu"
} as const;

