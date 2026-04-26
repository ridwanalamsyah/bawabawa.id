import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { fetchAllSettings, fetchAllNavItems, fetchPages, fetchSections, fetchMedia } from "../../shared/api/cms";
import { AdminLayout } from "./AdminLayout";

interface OverviewStats {
  settings: number;
  nav: number;
  pages: number;
  sections: number;
  media: number;
}

export function AdminPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAllSettings().catch(() => []),
      fetchAllNavItems().catch(() => []),
      fetchPages().catch(() => []),
      fetchSections().catch(() => []),
      fetchMedia().catch(() => [])
    ])
      .then(([settings, nav, pages, sections, media]) => {
        if (cancelled) return;
        setStats({
          settings: settings.length,
          nav: nav.length,
          pages: pages.length,
          sections: sections.length,
          media: media.length
        });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Gagal memuat statistik admin";
        setError(message);
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout
      title="Platform Governance"
      subtitle="Kontrol konten, navigasi, RBAC, dan keamanan platform — semua dalam satu kanvas, tanpa hardcode."
    >
      {error ? <div className="admin-error">{error}</div> : null}

      <div className="admin-overview-grid">
        <Stat label="Site Settings" value={stats?.settings ?? "—"} hint="Brand, contact, SEO, feature flags" to="/admin/cms/settings" />
        <Stat label="Navigation Items" value={stats?.nav ?? "—"} hint="Menu utama (urutkan, sembunyikan, role-gate)" to="/admin/cms/navigation" />
        <Stat label="Pages" value={stats?.pages ?? "—"} hint="Halaman statis yang bisa dipublish" to="/admin/cms/pages" />
        <Stat label="Sections" value={stats?.sections ?? "—"} hint="Hero / CTA / blok terstruktur" to="/admin/cms/sections" />
        <Stat label="Media" value={stats?.media ?? "—"} hint="URL aset publik" to="/admin/cms/media" />
      </div>

      <h2 className="admin-section-title" style={{ marginTop: 28 }}>Scope governance</h2>
      <p className="admin-section-subtitle">
        Konsol ini menggantikan semua konten hardcode (brand, logo, kontak, sosial, navigasi) dengan data yang
        bisa diedit langsung. Semua perubahan terikat ke RBAC <code>cms:manage</code> dan tercatat di kolom
        <code> updated_by</code> tabel terkait.
      </p>
      <ul className="admin-list">
        <li className="admin-list-item">
          <span aria-hidden="true">⚙</span>
          <div className="admin-list-item-grow">
            <strong>Site Settings</strong>
            <span>Brand identity (nama, monogram, warna), kontak, sosial, defaults SEO, feature flags.</span>
          </div>
          <Link to="/admin/cms/settings" className="admin-pill">Buka</Link>
        </li>
        <li className="admin-list-item">
          <span aria-hidden="true">🧭</span>
          <div className="admin-list-item-grow">
            <strong>Navigation</strong>
            <span>Edit label, link, urutan, dan role-gate menu utama secara live.</span>
          </div>
          <Link to="/admin/cms/navigation" className="admin-pill">Buka</Link>
        </li>
        <li className="admin-list-item">
          <span aria-hidden="true">📄</span>
          <div className="admin-list-item-grow">
            <strong>Pages</strong>
            <span>Halaman About / Kontak / Term — rich text Tiptap, draft &amp; publish flow, meta SEO.</span>
          </div>
          <Link to="/admin/cms/pages" className="admin-pill">Buka</Link>
        </li>
        <li className="admin-list-item">
          <span aria-hidden="true">🧩</span>
          <div className="admin-list-item-grow">
            <strong>Sections</strong>
            <span>Blok hero / CTA / banner berkunci <code>section_key</code>, dipanggil dari frontend.</span>
          </div>
          <Link to="/admin/cms/sections" className="admin-pill">Buka</Link>
        </li>
        <li className="admin-list-item">
          <span aria-hidden="true">🖼</span>
          <div className="admin-list-item-grow">
            <strong>Media</strong>
            <span>Daftar URL gambar yang siap dipakai sebagai logo, og:image, atau ilustrasi sections.</span>
          </div>
          <Link to="/admin/cms/media" className="admin-pill">Buka</Link>
        </li>
      </ul>
    </AdminLayout>
  );
}

function Stat({ label, value, hint, to }: { label: string; value: number | string; hint: string; to: string }) {
  return (
    <Link to={to} className="admin-stat" style={{ textDecoration: "none" }}>
      <span className="admin-stat-label">{label}</span>
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-hint">{hint}</span>
    </Link>
  );
}
