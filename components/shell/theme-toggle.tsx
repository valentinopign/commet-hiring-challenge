"use client";

import { MoonIcon } from "@/components/icons/moon-icon";
import { SunIcon } from "@/components/icons/sun-icon";
import { iconControlClass } from "@/components/ui/control-styles";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/**
 * A theme flip changes colours on nearly every element at once. Elements with a colour
 * transition would fade while the rest snap, so the switch smears. Transitions are switched off,
 * a reflow commits the new colours while that override applies, and they come back two frames
 * later, after the new theme has painted. The toggle's own icons are the exception: their swap
 * is the one transition meant to be seen.
 */
function withoutTransitions(change: () => void) {
  const style = document.createElement("style");
  style.append(document.createTextNode("*:not(.theme-icon),*::before,*::after{transition:none !important}"));
  document.head.append(style);
  change();
  // Read for its side effect: forces the style flush while the override is still in place.
  void document.body.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
}

/**
 * Client only for the click. Both icons and both labels are always rendered and CSS shows the
 * ones that fit the current theme, so the server never needs to know the theme and hydration
 * never mismatches. The icons are stacked in one spot so one can turn into the other.
 */
export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const nextTheme: Theme = root.dataset.theme === "light" ? "dark" : "light";
    withoutTransitions(() => {
      root.dataset.theme = nextTheme;
    });
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Storage can be blocked; the theme still changes for this visit.
    }
  }

  return (
    <button type="button" onClick={toggleTheme} className={iconControlClass}>
      <span aria-hidden="true" className="relative size-4">
        <SunIcon className="theme-icon light:theme-icon-hidden absolute inset-0 size-4" />
        <MoonIcon className="theme-icon theme-icon-hidden light:theme-icon-shown absolute inset-0 size-4" />
      </span>
      <span className="sr-only light:hidden">Switch to light theme</span>
      <span className="sr-only hidden light:inline">Switch to dark theme</span>
    </button>
  );
}
