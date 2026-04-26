export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "bb_themeMode";
const THEME_EVENT = "bb:theme-change";

function prefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

export function getInitialThemeMode(): ThemeMode {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark") return raw;
  return prefersDark() ? "dark" : "light";
}

export function applyThemeMode(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.style.colorScheme = mode;
  window.localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_EVENT, { detail: mode }));
}

export function initThemeMode() {
  applyThemeMode(getInitialThemeMode());
}

export function toggleThemeMode(): ThemeMode {
  const current = (document.documentElement.getAttribute("data-theme") as ThemeMode | null) ?? getInitialThemeMode();
  const next: ThemeMode = current === "dark" ? "light" : "dark";
  applyThemeMode(next);
  return next;
}

export function subscribeThemeMode(listener: (mode: ThemeMode) => void): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ThemeMode>).detail;
    if (detail === "light" || detail === "dark") listener(detail);
  };
  window.addEventListener(THEME_EVENT, handler);
  return () => window.removeEventListener(THEME_EVENT, handler);
}
