import { useEffect } from "react";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";

export function ThemeApplier() {
  const { theme } = useAppPreferences();

  useEffect(() => {
    document.body.classList.remove("light", "dark");
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else if (theme === "light") {
      document.body.classList.add("light");
    } else {
      // system: use prefers-color-scheme
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.classList.add(isDark ? "dark" : "light");
    }
  }, [theme]);

  return null;
} 