const STORAGE_KEY = "bb_themeMode";
function prefersDark() {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}
export function getInitialThemeMode() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark")
        return raw;
    return prefersDark() ? "dark" : "light";
}
export function applyThemeMode(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
}
export function initThemeMode() {
    applyThemeMode(getInitialThemeMode());
}
