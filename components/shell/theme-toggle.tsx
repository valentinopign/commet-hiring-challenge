"use client";

import { MoonIcon } from "@/components/icons/moon-icon";
import { SunIcon } from "@/components/icons/sun-icon";
import { iconControlClass } from "@/components/ui/control-styles";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/**
 * Client only for the click. Both labels are always rendered and CSS shows the one that fits
 * the current theme, so the server never needs to know the theme and hydration never mismatches.
 */
export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const nextTheme: Theme = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = nextTheme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Storage can be blocked; the theme still changes for this visit.
    }
  }

  return (
    <button type="button" onClick={toggleTheme} className={iconControlClass}>
      <span className="contents light:hidden">
        <SunIcon />
        <span className="sr-only">Switch to light theme</span>
      </span>
      <span className="hidden light:contents">
        <MoonIcon />
        <span className="sr-only">Switch to dark theme</span>
      </span>
    </button>
  );
}
