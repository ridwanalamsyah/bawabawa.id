import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AppShell } from "../../shared/ui/shell/AppShell";
import { Button, GlassCard } from "../../shared/ui/primitives";

export interface ForbiddenPageProps {
  /** Permission that the route required, used to render a helpful message. */
  requiredPermission?: string;
  title?: string;
  description?: string;
}

export function ForbiddenPage({ requiredPermission, title, description }: ForbiddenPageProps) {
  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
        style={{ display: "grid", placeItems: "center", padding: "8vh 0" }}
      >
        <GlassCard
          elevated
          style={{ maxWidth: 560, textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div
            aria-hidden="true"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(48px, 9vw, 88px)",
              background: "var(--brand-gradient)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1
            }}
          >
            403
          </div>
          <h1>{title ?? "Akses Ditolak"}</h1>
          <p style={{ color: "var(--color-muted)" }}>
            {description ??
              "Kamu tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator jika kamu rasa ini keliru."}
          </p>
          {requiredPermission ? (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--color-subtle)",
                margin: 0
              }}
            >
              Permission yang dibutuhkan: <code>{requiredPermission}</code>
            </p>
          ) : null}
          <div style={{ display: "inline-flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/">
              <Button variant="primary" size="lg">
                Kembali ke Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="lg" onClick={() => window.history.back()}>
              Halaman sebelumnya
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </AppShell>
  );
}
