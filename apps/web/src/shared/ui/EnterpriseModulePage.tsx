import { motion } from "framer-motion";
import { GlassCard } from "./primitives";
import { AppShell } from "./shell/AppShell";

type EnterpriseModulePageProps = {
  title: string;
  subtitle: string;
  points: string[];
};

export function EnterpriseModulePage({ title, subtitle, points }: EnterpriseModulePageProps) {
  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
      >
        <GlassCard elevated>
          <h1>{title}</h1>
          <p style={{ marginTop: 8, color: "var(--color-muted)", fontSize: 16 }}>{subtitle}</p>
          <p style={{ margin: "20px 0 8px", fontWeight: 700, color: "var(--color-text-strong)" }}>
            Scope aktif
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--color-text)", lineHeight: 1.8 }}>
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </GlassCard>
      </motion.section>
    </AppShell>
  );
}
