"use client";

import { usePathname } from "next/navigation";

/**
 * Lightweight top-of-page progress bar that re-triggers a CSS animation on
 * every pathname change. Pure CSS keyframes (no setState in effect) keep the
 * Strict Mode + RSC behaviour predictable.
 */
export function RouteProgress() {
  const pathname = usePathname();
  return (
    <div
      aria-hidden
      className="fixed top-0 inset-x-0 z-[60] h-[2px] pointer-events-none"
    >
      <div
        key={pathname}
        className="route-progress-bar h-full bg-linear-to-r from-[hsl(var(--sage-400))] via-[hsl(var(--sage-600))] to-[hsl(var(--olive-500))]"
      />
    </div>
  );
}
