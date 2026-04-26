import { useEffect, useState } from "react";

/**
 * Reactive media query hook. Returns false during SSR and on the very first render
 * to keep the markup deterministic, then updates after mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const list = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(list.matches);
    if (list.addEventListener) {
      list.addEventListener("change", handler);
      return () => list.removeEventListener("change", handler);
    }
    list.addListener(handler);
    return () => list.removeListener(handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}
