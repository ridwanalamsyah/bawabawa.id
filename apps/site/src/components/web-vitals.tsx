"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Reports Core Web Vitals (LCP / INP / CLS) to the analytics backend.
 * Currently logs to console in dev and POSTs to /api/analytics/vitals in prod
 * if the endpoint is configured. Vercel Analytics + Speed Insights pick these
 * up automatically when the official packages are installed.
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "development") {
      console.debug("[web-vitals]", metric.name, metric.value, metric);
      return;
    }
    try {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        label: metric.label,
        delta: metric.delta,
        page: typeof window !== "undefined" ? window.location.pathname : null,
      });
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/vitals", blob);
      }
    } catch {
      // swallow — vitals reporting must never break the app
    }
  });
  return null;
}
