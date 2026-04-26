import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AdminLayout } from "./AdminLayout";
import { Button } from "../../shared/ui/primitives";
import {
  fetchAllSettings,
  upsertSetting,
  type BrandSettings,
  type ContactSettings,
  type FeatureFlags,
  type SeoSettings,
  type SocialSettings,
  type SiteSetting
} from "../../shared/api/cms";
import { useCms } from "../cms/CmsContext";

interface FormShape {
  brand: BrandSettings;
  contact: ContactSettings;
  social: SocialSettings;
  seo: SeoSettings;
  featureFlags: FeatureFlags;
}

const EMPTY_FORM: FormShape = {
  brand: {
    name: "",
    shortName: "",
    tagline: "",
    monogram: "",
    logoUrl: null,
    primaryColor: "#7c9885",
    accentColor: "#d4a373"
  },
  contact: {
    email: "",
    phone: "",
    address: "",
    supportHours: ""
  },
  social: {
    instagram: null,
    linkedin: null,
    twitter: null,
    youtube: null
  },
  seo: {
    defaultTitle: "",
    defaultDescription: "",
    ogImage: null,
    twitterCard: "summary_large_image"
  },
  featureFlags: {
    enableDarkMode: true,
    enableMobileMenu: true,
    showWelcomeToast: true
  }
};

function pick<V>(settings: SiteSetting[], key: string, fallback: V): V {
  const item = settings.find((s) => s.key === key);
  return item && item.value ? (item.value as V) : fallback;
}

export function SiteSettingsPage() {
  const cms = useCms();
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormShape>({
    defaultValues: EMPTY_FORM
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllSettings()
      .then((settings) => {
        if (cancelled) return;
        reset({
          brand: pick<BrandSettings>(settings, "brand", EMPTY_FORM.brand),
          contact: pick<ContactSettings>(settings, "contact", EMPTY_FORM.contact),
          social: pick<SocialSettings>(settings, "social", EMPTY_FORM.social),
          seo: pick<SeoSettings>(settings, "seo", EMPTY_FORM.seo),
          featureFlags: pick<FeatureFlags>(settings, "feature_flags", EMPTY_FORM.featureFlags)
        });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Gagal memuat settings";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reset]);

  async function onSubmit(values: FormShape) {
    try {
      await Promise.all([
        upsertSetting("brand", values.brand),
        upsertSetting("contact", values.contact),
        upsertSetting("social", values.social),
        upsertSetting("seo", values.seo),
        upsertSetting("feature_flags", values.featureFlags)
      ]);
      toast.success("Site settings tersimpan");
      void cms.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan settings";
      toast.error(message);
    }
  }

  const primaryColor = watch("brand.primaryColor");
  const accentColor = watch("brand.accentColor");

  return (
    <AdminLayout
      title="Site Settings"
      subtitle="Brand identity, kontak, sosial, defaults SEO, feature flags. Disimpan ke tabel site_settings."
    >
      {error ? <div className="admin-error">{error}</div> : null}
      {loading ? (
        <div className="admin-loading">Memuat settings…</div>
      ) : (
        <form className="admin-form" onSubmit={handleSubmit(onSubmit)}>
          {/* Brand */}
          <fieldset style={{ border: "none", padding: 0 }}>
            <h2 className="admin-section-title">Brand identity</h2>
            <p className="admin-section-subtitle">Nama, monogram navbar, dan warna utama design system.</p>
            <div className="admin-row two-col">
              <div className="admin-field">
                <label htmlFor="brand-name">Nama brand</label>
                <input id="brand-name" {...register("brand.name", { required: "Nama brand wajib" })} />
                {errors.brand?.name ? <span className="admin-field-hint" style={{ color: "#b91c1c" }}>{errors.brand.name.message}</span> : null}
              </div>
              <div className="admin-field">
                <label htmlFor="brand-short">Short name</label>
                <input id="brand-short" {...register("brand.shortName")} />
              </div>
            </div>
            <div className="admin-row two-col">
              <div className="admin-field">
                <label htmlFor="brand-tagline">Tagline</label>
                <input id="brand-tagline" {...register("brand.tagline")} />
              </div>
              <div className="admin-field">
                <label htmlFor="brand-monogram">Monogram (2 huruf)</label>
                <input id="brand-monogram" maxLength={4} {...register("brand.monogram", { required: true })} />
              </div>
            </div>
            <div className="admin-row two-col">
              <div className="admin-field">
                <label htmlFor="brand-primary">Warna utama</label>
                <input id="brand-primary" type="color" style={{ height: 44, padding: 4 }} {...register("brand.primaryColor")} />
                <span className="admin-field-hint">Saat ini: {primaryColor}</span>
              </div>
              <div className="admin-field">
                <label htmlFor="brand-accent">Warna aksen</label>
                <input id="brand-accent" type="color" style={{ height: 44, padding: 4 }} {...register("brand.accentColor")} />
                <span className="admin-field-hint">Saat ini: {accentColor}</span>
              </div>
            </div>
            <div className="admin-field">
              <label htmlFor="brand-logo">Logo URL (optional)</label>
              <input id="brand-logo" type="url" placeholder="https://…" {...register("brand.logoUrl")} />
              <span className="admin-field-hint">Override monogram dengan logo image. Pakai URL dari Media library.</span>
            </div>
          </fieldset>

          {/* Contact */}
          <fieldset style={{ border: "none", padding: 0 }}>
            <h2 className="admin-section-title">Kontak</h2>
            <div className="admin-row two-col">
              <div className="admin-field">
                <label htmlFor="contact-email">Email</label>
                <input id="contact-email" type="email" {...register("contact.email")} />
              </div>
              <div className="admin-field">
                <label htmlFor="contact-phone">Telepon</label>
                <input id="contact-phone" {...register("contact.phone")} />
              </div>
            </div>
            <div className="admin-row two-col">
              <div className="admin-field">
                <label htmlFor="contact-address">Alamat</label>
                <input id="contact-address" {...register("contact.address")} />
              </div>
              <div className="admin-field">
                <label htmlFor="contact-hours">Jam dukungan</label>
                <input id="contact-hours" {...register("contact.supportHours")} />
              </div>
            </div>
          </fieldset>

          {/* Social */}
          <fieldset style={{ border: "none", padding: 0 }}>
            <h2 className="admin-section-title">Sosial</h2>
            <div className="admin-row two-col">
              <div className="admin-field">
                <label htmlFor="s-ig">Instagram URL</label>
                <input id="s-ig" type="url" placeholder="https://…" {...register("social.instagram")} />
              </div>
              <div className="admin-field">
                <label htmlFor="s-li">LinkedIn URL</label>
                <input id="s-li" type="url" placeholder="https://…" {...register("social.linkedin")} />
              </div>
            </div>
            <div className="admin-row two-col">
              <div className="admin-field">
                <label htmlFor="s-tw">X / Twitter URL</label>
                <input id="s-tw" type="url" placeholder="https://…" {...register("social.twitter")} />
              </div>
              <div className="admin-field">
                <label htmlFor="s-yt">YouTube URL</label>
                <input id="s-yt" type="url" placeholder="https://…" {...register("social.youtube")} />
              </div>
            </div>
          </fieldset>

          {/* SEO */}
          <fieldset style={{ border: "none", padding: 0 }}>
            <h2 className="admin-section-title">SEO defaults</h2>
            <div className="admin-field">
              <label htmlFor="seo-title">Default title</label>
              <input id="seo-title" {...register("seo.defaultTitle")} />
            </div>
            <div className="admin-field">
              <label htmlFor="seo-desc">Default description</label>
              <textarea id="seo-desc" rows={3} {...register("seo.defaultDescription")} />
            </div>
            <div className="admin-row two-col">
              <div className="admin-field">
                <label htmlFor="seo-og">OG image URL</label>
                <input id="seo-og" type="url" placeholder="https://…" {...register("seo.ogImage")} />
              </div>
              <div className="admin-field">
                <label htmlFor="seo-card">Twitter card</label>
                <select id="seo-card" {...register("seo.twitterCard")}>
                  <option value="summary">summary</option>
                  <option value="summary_large_image">summary_large_image</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Feature flags */}
          <fieldset style={{ border: "none", padding: 0 }}>
            <h2 className="admin-section-title">Feature flags</h2>
            <p className="admin-section-subtitle">Toggle global yang bisa dimatikan tanpa redeploy.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text)" }}>
                <input type="checkbox" {...register("featureFlags.enableDarkMode")} />
                Aktifkan dark mode toggle
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text)" }}>
                <input type="checkbox" {...register("featureFlags.enableMobileMenu")} />
                Aktifkan mobile hamburger menu
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text)" }}>
                <input type="checkbox" {...register("featureFlags.showWelcomeToast")} />
                Tampilkan toast selamat datang setelah login
              </label>
            </div>
          </fieldset>

          <div className="admin-actions">
            <Button type="submit" loading={isSubmitting}>Simpan semua</Button>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
