import { useEffect, useState } from "react";
import {
  applyThemeMode,
  getInitialThemeMode,
  subscribeThemeMode,
  toggleThemeMode,
  type ThemeMode
} from "../../design-system/theme";

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const attr = document.documentElement.getAttribute("data-theme") as ThemeMode | null;
    return attr === "light" || attr === "dark" ? attr : getInitialThemeMode();
  });

  useEffect(() => subscribeThemeMode(setMode), []);

  return {
    mode,
    isDark: mode === "dark",
    toggle: () => setMode(toggleThemeMode()),
    set: (next: ThemeMode) => {
      applyThemeMode(next);
      setMode(next);
    }
  };
}
