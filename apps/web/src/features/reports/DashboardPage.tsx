import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "../../shared/ui/shell/AppShell";
import { GlassCard } from "../../shared/ui/primitives";
import { usePermission } from "../../shared/hooks/usePermission";
import { useBrand } from "../cms/CmsContext";
import { api } from "../../shared/api/client";
import { formatIdr, formatNumber } from "../../shared/lib/format";
import "./DashboardPage.css";

interface ModuleCard {
  path: string;
  label: string;
  description: string;
  permission?: string;
}

interface KpiResponse {
  dailySales?: number;
  topProduct?: string;
  loyalCustomers?: number;
  stockAlerts?: number;
}

const MODULES: ModuleCard[] = [
  { path: "/sales", label: "Penjualan", description: "Pipeline, target, dan pendapatan tim sales." },
  { path: "/orders", label: "Pesanan", description: "Buat pesanan, alokasi stok, dan tagihan.", permission: "orders:read" },
  { path: "/inventory", label: "Inventaris", description: "Stok multi-gudang, riwayat pergerakan." },
  { path: "/procurement", label: "Pengadaan", description: "Purchase order, supplier, dan penerimaan." },
  { path: "/finance", label: "Keuangan", description: "Arus kas, transaksi, dan bagi hasil.", permission: "finance:manage_finance" },
  { path: "/crm", label: "CRM", description: "Pelanggan, lead, dan riwayat interaksi." },
  { path: "/hr", label: "SDM", description: "Karyawan, absensi, dan penggajian." },
  { path: "/admin", label: "Pengaturan", description: "Konten website, akses pengguna, audit.", permission: "users:manage_users" }
];

export function DashboardPage() {
  const permission = usePermission();
  const brand = useBrand();
  const [kpi, setKpi] = useState<KpiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const visibleModules = MODULES.filter(
    (mod) => !mod.permission || permission.has(mod.permission)
  );

  useEffect(() => {
    let active = true;
    api
      .get<{ data?: KpiResponse }>("/reports/kpi")
      .then((response) => {
        if (active) setKpi(response.data?.data ?? null);
      })
      .catch(() => {
        if (active) setKpi(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
      >
        <GlassCard elevated className="dashboard-hero">
          <span className="dashboard-pill">Tersinkron · Real-time</span>
          <h1>Beranda {brand.name}</h1>
          <p style={{ marginTop: 12, color: "var(--color-muted)", fontSize: 16 }}>
            Pantau ringkasan bisnis — penjualan, pelanggan, dan stok — dalam satu kanvas.
            Data tersinkron langsung dengan operasi harian Anda.
          </p>
          <div className="dashboard-kpi-grid">
            <DashboardKpi
              label="Penjualan Hari Ini"
              value={loading ? null : formatIdr(kpi?.dailySales ?? 0)}
              tone="positive"
            />
            <DashboardKpi
              label="Produk Terlaris"
              value={loading ? null : kpi?.topProduct || "—"}
            />
            <DashboardKpi
              label="Pelanggan Loyal"
              value={loading ? null : formatNumber(kpi?.loyalCustomers ?? 0)}
            />
            <DashboardKpi
              label="Alert Stok"
              value={loading ? null : formatNumber(kpi?.stockAlerts ?? 0)}
              tone={(kpi?.stockAlerts ?? 0) > 0 ? "warn" : "muted"}
            />
          </div>
        </GlassCard>
      </motion.section>

      <section className="dashboard-grid" aria-label="Modul aktif">
        {visibleModules.map((mod, index) => (
          <motion.div
            key={mod.path}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.36,
              ease: [0.32, 0.72, 0, 1],
              delay: 0.04 * index
            }}
          >
            <Link to={mod.path} className="dashboard-module-link" aria-label={mod.label}>
              <GlassCard interactive className="dashboard-module-card">
                <strong>{mod.label}</strong>
                <span>{mod.description}</span>
                <span className="dashboard-module-arrow" aria-hidden="true">
                  →
                </span>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </section>
    </AppShell>
  );
}

function DashboardKpi({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string | null;
  tone?: "default" | "positive" | "warn" | "muted";
}) {
  return (
    <article className="dashboard-kpi" data-tone={tone}>
      <span className="dashboard-kpi-label">{label}</span>
      <strong className="dashboard-kpi-value">
        {value === null ? <span className="dashboard-kpi-skeleton" aria-hidden="true" /> : value}
      </strong>
    </article>
  );
}
