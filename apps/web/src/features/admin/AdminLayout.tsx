import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { AppShell } from "../../shared/ui/shell/AppShell";
import { GlassCard } from "../../shared/ui/primitives";
import "./admin.css";

interface AdminTab {
  to: string;
  label: string;
  icon: string;
}

const ADMIN_TABS: AdminTab[] = [
  { to: "/admin", label: "Overview", icon: "🏛" },
  { to: "/admin/cms/settings", label: "Site Settings", icon: "⚙" },
  { to: "/admin/cms/navigation", label: "Navigation", icon: "🧭" },
  { to: "/admin/cms/pages", label: "Pages", icon: "📄" },
  { to: "/admin/cms/sections", label: "Sections", icon: "🧩" },
  { to: "/admin/cms/media", label: "Media", icon: "🖼" }
];

export function AdminLayout({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        className="admin-stack"
      >
        <header className="admin-header">
          <h1 className="admin-title">{title}</h1>
          {subtitle ? <p className="admin-subtitle">{subtitle}</p> : null}
        </header>

        <nav className="admin-tabs" aria-label="Admin sections">
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === "/admin"}
              className={({ isActive }) =>
                `admin-tab ${isActive ? "admin-tab-active" : ""}`
              }
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>

        <GlassCard elevated className="admin-panel">
          {children}
        </GlassCard>
      </motion.section>
    </AppShell>
  );
}
