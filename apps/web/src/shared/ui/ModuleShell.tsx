import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { GlassCard, Button } from "./primitives";
import { AppShell } from "./shell/AppShell";
import { cn } from "../lib/cn";
import "./module-shell.css";

export type ModuleKpiTone = "default" | "positive" | "warn" | "muted";

export interface ModuleKpi {
  label: string;
  /** Pre-formatted display value (use formatIdr/formatNumber upstream). */
  value: string;
  hint?: string;
  tone?: ModuleKpiTone;
}

export interface ModuleEmptyState {
  /** Decorative icon/emoji to anchor the empty card. Optional. */
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  /** Internal route to navigate to when actionLabel is clicked. */
  actionTo?: string;
  onAction?: () => void;
}

export interface ModuleShellProps {
  title: string;
  /** Plain user-facing copy. Avoid mentioning APIs, tables, or column names. */
  subtitle: string;
  /** Optional KPIs rendered as a card grid above the content. */
  kpis?: ModuleKpi[];
  /** When true, render a skeleton row instead of values inside the KPI cards. */
  loading?: boolean;
  /** Empty-state card. Render when there is no data yet. */
  empty?: ModuleEmptyState;
  /** Body content (table, list, etc.). Rendered when not in empty mode. */
  children?: ReactNode;
}

export function ModuleShell({
  title,
  subtitle,
  kpis,
  loading,
  empty,
  children
}: ModuleShellProps) {
  return (
    <AppShell>
      <motion.section
        className="bb-module"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
      >
        <header className="bb-module-header">
          <h1 className="bb-module-title">{title}</h1>
          <p className="bb-module-subtitle">{subtitle}</p>
        </header>

        {kpis && kpis.length > 0 ? (
          <div className="bb-module-kpis" role="list" aria-label="Ringkasan metrik">
            {kpis.map((kpi) => (
              <GlassCard
                key={kpi.label}
                className={cn("bb-module-kpi", `bb-module-kpi--${kpi.tone ?? "default"}`)}
                role="listitem"
              >
                <span className="bb-module-kpi-label">{kpi.label}</span>
                <strong className="bb-module-kpi-value" data-loading={loading || undefined}>
                  {loading ? <span className="bb-module-kpi-skeleton" /> : kpi.value}
                </strong>
                {kpi.hint ? <span className="bb-module-kpi-hint">{kpi.hint}</span> : null}
              </GlassCard>
            ))}
          </div>
        ) : null}

        {empty ? (
          <GlassCard elevated className="bb-module-empty">
            {empty.icon ? <span className="bb-module-empty-icon" aria-hidden="true">{empty.icon}</span> : null}
            <h2 className="bb-module-empty-title">{empty.title}</h2>
            <p className="bb-module-empty-desc">{empty.description}</p>
            {empty.actionLabel ? (
              empty.actionTo ? (
                <Link to={empty.actionTo}>
                  <Button variant="primary">{empty.actionLabel}</Button>
                </Link>
              ) : (
                <Button variant="primary" onClick={empty.onAction}>
                  {empty.actionLabel}
                </Button>
              )
            ) : null}
          </GlassCard>
        ) : (
          children
        )}
      </motion.section>
    </AppShell>
  );
}
