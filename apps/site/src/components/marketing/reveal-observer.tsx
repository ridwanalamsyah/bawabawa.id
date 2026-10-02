"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Adds `.is-visible` to every `[data-reveal]` element as it scrolls into
 * view. The hiding CSS only applies after this puts `.reveal-ready` on
 * <html>, so pages render fully visible without JS. Elements added later
 * (filters, client-loaded lists) are picked up by a MutationObserver.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const track = (el: Element, instant: boolean) => {
      if (el.classList.contains("is-visible")) return;
      // Already on screen at first scan: show at once, no flash.
      if (instant && el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        el.classList.add("is-visible");
        return;
      }
      io.observe(el);
    };

    document.querySelectorAll("[data-reveal]").forEach((el) => track(el, true));
    document.documentElement.classList.add("reveal-ready");

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches("[data-reveal]")) track(n, false);
          n.querySelectorAll("[data-reveal]").forEach((el) => track(el, false));
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
