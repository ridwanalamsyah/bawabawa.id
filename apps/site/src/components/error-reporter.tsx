"use client";

import { useEffect } from "react";

/**
 * Lightweight client-side error reporter. Forwards uncaught errors and
 * unhandled promise rejections to `/api/analytics/errors` via
 * `navigator.sendBeacon` so the request never blocks the page. Designed to
 * be a drop-in replacement for Sentry's free tier when self-hosting — the
 * server route can later be wired to Sentry, Datadog, or Plausible.
 *
 * Mount once in the root layout next to <WebVitalsReporter />.
 */
export function ErrorReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    function send(payload: Record<string, unknown>) {
      try {
        const body = JSON.stringify({
          ...payload,
          path: window.location.pathname,
          userAgent: navigator.userAgent,
          ts: new Date().toISOString(),
        });
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon("/api/analytics/errors", blob);
        } else {
          fetch("/api/analytics/errors", {
            method: "POST",
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* never fail the host page */
      }
    }

    function onError(event: ErrorEvent) {
      send({
        type: "error",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      send({
        type: "unhandled-rejection",
        message:
          typeof reason === "string" ? reason : reason?.message ?? "Unknown",
        stack: reason?.stack,
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
