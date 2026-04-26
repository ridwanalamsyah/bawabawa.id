import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "../../shared/ui/shell/AppShell";
import { GlassCard } from "../../shared/ui/primitives";
import { usePermission } from "../../shared/hooks/usePermission";
import "./DashboardPage.css";

interface ModuleCard {
  path: string;
  label: string;
  description: string;
  permission?: string;
}

const MODULES: ModuleCard[] = [
  { path: "/sales", label: "Sales", description: "Pipeline, quotation, dan target tim sales." },
  { path: "/orders", label: "Orders", description: "Buat order, alokasi stok, dan tagihan.", permission: "orders:read" },
  { path: "/inventory", label: "Inventory", description: "Stok multi-gudang, stock take, dan adjust." },
  { path: "/procurement", label: "Procurement", description: "PR, PO, vendor, dan price book." },
  { path: "/finance", label: "Finance", description: "GL, AR, AP, dan kas-bank.", permission: "finance:manage_finance" },
  { path: "/crm", label: "CRM", description: "Customer 360, lead, dan campaign." },
  { path: "/hr", label: "HR", description: "Karyawan, absensi, dan payroll." },
  { path: "/admin", label: "Admin", description: "RBAC, audit, dan platform settings.", permission: "users:manage_users" }
];

export function DashboardPage() {
  const permission = usePermission();
  const visibleModules = MODULES.filter(
    (mod) => !mod.permission || permission.has(mod.permission)
  );

  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
      >
        <GlassCard elevated className="dashboard-hero">
          <span className="dashboard-pill">Live · cloud-sync</span>
          <h1>bawabawa.id Control Center</h1>
          <p style={{ marginTop: 12, color: "var(--color-muted)", fontSize: 16 }}>
            Pantau pulsa bisnismu — sales, finance, dan operasi — dalam satu kanvas.
            Visual glass dengan status realtime, dirancang mobile-first.
          </p>
          <div className="dashboard-chart-grid">
            <article className="dashboard-mini-chart">
              <h3>Sales Pulse</h3>
              <div className="bars" aria-hidden="true">
                <span style={{ height: "36%" }} />
                <span style={{ height: "58%" }} />
                <span style={{ height: "72%" }} />
                <span style={{ height: "45%" }} />
                <span style={{ height: "84%" }} />
              </div>
            </article>
            <article className="dashboard-mini-chart">
              <h3>Finance Signal</h3>
              <div className="trend-line" aria-hidden="true">
                <div />
              </div>
            </article>
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
