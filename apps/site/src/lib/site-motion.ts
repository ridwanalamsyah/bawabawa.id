import { erp } from "@/lib/erp-client";

/**
 * Site-wide animation switches, set by staff in Admin → Pengaturan →
 * Animasi (CMS setting `site_motion`). Everything is on by default, so the
 * site looks right even when the ERP is unreachable.
 */
export type SiteMotion = {
  /** Master switch for every animation on the public site. */
  animations: boolean;
  /** Blurred colour orbs drifting behind the hero. */
  ambient: boolean;
};

export const DEFAULT_SITE_MOTION: SiteMotion = { animations: true, ambient: true };

export async function getSiteMotion(): Promise<SiteMotion> {
  try {
    const settings = await erp.cmsSettingsPublic();
    const row = settings.find((s) => s.key === "site_motion");
    const v = (row?.value ?? {}) as Partial<Record<keyof SiteMotion, unknown>>;
    const flag = (x: unknown, d: boolean) => (typeof x === "boolean" ? x : d);
    return {
      animations: flag(v.animations, DEFAULT_SITE_MOTION.animations),
      ambient: flag(v.ambient, DEFAULT_SITE_MOTION.ambient),
    };
  } catch {
    return DEFAULT_SITE_MOTION;
  }
}
