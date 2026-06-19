import { useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";
const DEFAULT_THEME: Theme = "light";
const THEME_STORAGE_KEY = "shuzhi-business-theme";
const THEME_CHANGE_EVENT = "shuzhi-business-theme-change";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : DEFAULT_THEME;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = () => setThemeState(getStoredTheme());
    window.addEventListener("storage", syncTheme);
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
    };
  }, []);

  const setTheme = useCallback((nextTheme: Theme | ((current: Theme) => Theme)) => {
    setThemeState((current) => {
      const resolved = typeof nextTheme === "function" ? nextTheme(current) : nextTheme;
      localStorage.setItem(THEME_STORAGE_KEY, resolved);
      document.documentElement.setAttribute("data-theme", resolved);
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
      return resolved;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, [setTheme]);

  const setLight = useCallback(() => setTheme("light"), [setTheme]);
  const setDark = useCallback(() => setTheme("dark"), [setTheme]);

  const isDark = theme === "dark";
  const isLight = theme === "light";

  return { theme, isDark, isLight, toggleTheme, setLight, setDark };
}
