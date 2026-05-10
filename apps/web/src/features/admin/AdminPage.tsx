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
      title="Pengaturan Platform"
      subtitle="Kelola konten website, menu navigasi, akses pengguna, dan keamanan dari satu tempat."
    >
      {error ? <div className="admin-error">{error}</div> : null}

      <div className="admin-overview-grid">
        <Stat label="Pengaturan Situs" value={stats?.settings ?? "—"} hint="Brand, kontak, SEO, dan toggle fitur" to="/admin/cms/settings" />
        <Stat label="Menu Navigasi" value={stats?.nav ?? "—"} hint="Atur urutan dan akses menu utama" to="/admin/cms/navigation" />
        <Stat label="Halaman" value={stats?.pages ?? "—"} hint="Halaman statis yang bisa dipublikasikan" to="/admin/cms/pages" />
        <Stat label="Bagian Konten" value={stats?.sections ?? "—"} hint="Hero, CTA, dan banner di landing page" to="/admin/cms/sections" />
        <Stat label="Media" value={stats?.media ?? "—"} hint="Galeri aset publik (logo, gambar)" to="/admin/cms/media" />
      </div>

      <h2 className="admin-section-title" style={{ marginTop: 28 }}>Cakupan pengaturan</h2>
      <p className="admin-section-subtitle">
        Semua konten website (brand, logo, kontak, sosial, navigasi) dapat diedit langsung dari sini —
        perubahan langsung ter-sinkron ke landing page publik. Setiap perubahan tercatat lengkap dengan
        siapa yang mengubah dan kapan.
      </p>
      <ul className="admin-list">
        <li className="admin-list-item">
          <span aria-hidden="true">⚙</span>
          <div className="admin-list-item-grow">
            <strong>Pengaturan Situs</strong>
            <span>Identitas brand (nama, monogram, warna), kontak, media sosial, default SEO, dan toggle fitur.</span>
          </div>
          <Link to="/admin/cms/settings" className="admin-pill">Buka</Link>
        </li>
        <li className="admin-list-item">
          <span aria-hidden="true">🧭</span>
          <div className="admin-list-item-grow">
            <strong>Menu Navigasi</strong>
            <span>Edit label, tautan, urutan, dan akses menu utama yang tampil di landing page.</span>
          </div>
          <Link to="/admin/cms/navigation" className="admin-pill">Buka</Link>
        </li>
        <li className="admin-list-item">
          <span aria-hidden="true">📄</span>
          <div className="admin-list-item-grow">
            <strong>Halaman</strong>
            <span>Halaman statis (Tentang, Kontak, Syarat) dengan editor kaya, alur draft &amp; publikasi, dan SEO.</span>
          </div>
          <Link to="/admin/cms/pages" className="admin-pill">Buka</Link>
        </li>
        <li className="admin-list-item">
          <span aria-hidden="true">🧩</span>
          <div className="admin-list-item-grow">
            <strong>Bagian Konten</strong>
            <span>Blok hero, CTA, dan banner yang tampil di landing page — diatur per bagian dan ter-sinkron langsung.</span>
          </div>
          <Link to="/admin/cms/sections" className="admin-pill">Buka</Link>
        </li>
        <li className="admin-list-item">
          <span aria-hidden="true">🖼</span>
          <div className="admin-list-item-grow">
            <strong>Media</strong>
            <span>Galeri aset publik (logo, gambar OG, ilustrasi) yang siap digunakan di seluruh konten.</span>
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
