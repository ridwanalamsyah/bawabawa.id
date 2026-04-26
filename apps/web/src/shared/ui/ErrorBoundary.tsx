import React from "react";
import { Button } from "./primitives/Button";
import { GlassCard } from "./primitives/GlassCard";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * App-wide React error boundary. Catches render-time exceptions, logs them
 * to the console (we wire to a real error reporter when one is configured),
 * and shows a recovery UI styled with the rest of the glass design system.
 *
 * Two recovery affordances:
 *  - "Coba lagi" resets local state so a transient error can clear without
 *    a hard reload (e.g. a stale CMS fetch that succeeds on retry).
 *  - "Muat ulang" forces a full reload as the last resort.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    if (typeof window !== "undefined") window.location.reload();
  };

  public render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV;
    const message = this.state.error?.message ?? "Unknown error";

    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "var(--gradient-mesh, transparent)"
        }}
      >
        <GlassCard style={{ maxWidth: 520, width: "100%", padding: "32px", textAlign: "left" }}>
          <h1 style={{ fontSize: 24, marginBottom: 12, fontFamily: "var(--font-display)" }}>
            Terjadi error tak terduga
          </h1>
          <p style={{ color: "var(--color-muted)", marginBottom: 16, lineHeight: 1.5 }}>
            Modul tidak dapat dimuat dengan benar. Silakan coba lagi atau muat ulang halaman jika
            masalah berlanjut. Tim kami sudah dicatat di log.
          </p>
          {isDev ? (
            <pre
              style={{
                fontSize: 12,
                background: "rgba(0,0,0,0.25)",
                color: "var(--color-text)",
                padding: 12,
                borderRadius: 8,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                marginBottom: 16
              }}
            >
              {message}
            </pre>
          ) : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="primary" onClick={this.handleRetry}>
              Coba lagi
            </Button>
            <Button variant="outline" onClick={this.handleReload}>
              Muat ulang halaman
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }
}
