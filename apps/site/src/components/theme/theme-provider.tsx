"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = React.createContext<{
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
} | null>(null);

const STORAGE_KEY = "bawabawa-theme";

function applyTheme(t: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (window.localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
}

function resolveTheme(t: Theme): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  if (t === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise from localStorage so we don't need an effect to push state into the tree.
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

  const setTheme = React.useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
    const next = resolveTheme(t);
    setResolved(next);
    applyTheme(next);
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
