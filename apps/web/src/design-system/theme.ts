export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "bb_themeMode";

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
  window.localStorage.setItem(STORAGE_KEY, mode);
}

export function initThemeMode() {
  applyThemeMode(getInitialThemeMode());
}

