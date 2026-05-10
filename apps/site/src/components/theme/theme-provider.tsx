"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = React.createContext<{
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
} | null>(null);

// Aligned with apps/web/src/design-system/theme.ts so a user that toggles dark
// mode in the ERP carries that preference into the public site (and vice
// versa). Falls back to the legacy `bawabawa-theme` key.
const STORAGE_KEY = "bb_themeMode";
const LEGACY_KEY = "bawabawa-theme";
const THEME_EVENT = "bb:theme-change";

function applyTheme(t: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.setAttribute("data-theme", t);
  root.style.colorScheme = t;
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const fresh = window.localStorage.getItem(STORAGE_KEY);
  if (fresh === "light" || fresh === "dark") return fresh;
  const legacy = window.localStorage.getItem(LEGACY_KEY);
  if (legacy === "light" || legacy === "dark" || legacy === "system") return legacy;
  return "system";
}

function resolveTheme(t: Theme): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  if (t === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => readStoredTheme());
  const [resolved, setResolved] = React.useState<"light" | "dark">(() => resolveTheme(readStoredTheme()));

  // Subscribe to OS preference changes — this is a true external subscription.
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const stored = readStoredTheme();
      if (stored === "system") {
        const next = mq.matches ? "dark" : "light";
        setResolved(next);
        applyTheme(next);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Cross-surface sync: when ERP web app emits a theme change, follow along.
  React.useEffect(() => {
    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent<"light" | "dark">).detail;
      if (detail === "light" || detail === "dark") {
        setThemeState(detail);
        setResolved(detail);
        applyTheme(detail);
      }
    };
    window.addEventListener(THEME_EVENT, onEvent);
    return () => window.removeEventListener(THEME_EVENT, onEvent);
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t === "system" ? "system" : t);
    localStorage.setItem(LEGACY_KEY, t);
    setThemeState(t);
    const next = resolveTheme(t);
    setResolved(next);
    applyTheme(next);
    // Mirror ERP's CustomEvent so other surfaces in the same browser sync.
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
