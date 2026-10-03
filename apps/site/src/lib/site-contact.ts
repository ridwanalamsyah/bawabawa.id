import { erp } from "@/lib/erp-client";
import { WA_NUMBER } from "@/lib/contact";

/**
 * Contact + social links edited in Admin → Pengaturan (CMS settings
 * `contact` and `social`). Falls back to env/defaults when unset or when
 * the ERP is unreachable, and drops empty social links.
 */
export type SiteContact = {
  email: string;
  whatsapp: string;
  address: string | null;
  supportHours: string | null;
  socials: Array<{ key: "instagram" | "tiktok" | "youtube"; url: string }>;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function getSiteContact(): Promise<SiteContact> {
  let contact: Record<string, unknown> = {};
  let social: Record<string, unknown> = {};
  try {
    const rows = await erp.cmsSettingsPublic();
    contact = (rows.find((r) => r.key === "contact")?.value ?? {}) as Record<string, unknown>;
    social = (rows.find((r) => r.key === "social")?.value ?? {}) as Record<string, unknown>;
  } catch {
    /* use defaults */
  }
  const phone = str(contact.phone)?.replace(/\D/g, "").replace(/^0/, "62");
  return {
    email: str(contact.email) ?? "hello@bawabawa.id",
    // Ignore the seeded placeholder (+62 812-0000-0000) so it never
    // replaces the real number from NEXT_PUBLIC_WA_NUMBER.
    whatsapp: phone && phone.length >= 10 && !/0000/.test(phone) ? phone : WA_NUMBER,
    address: str(contact.address),
    supportHours: str(contact.supportHours),
    socials: (["instagram", "tiktok", "youtube"] as const)
      .map((key) => ({ key, url: str(social[key]) }))
      .filter((s): s is { key: "instagram" | "tiktok" | "youtube"; url: string } => !!s.url && /^https?:\/\//.test(s.url)),
  };
}
