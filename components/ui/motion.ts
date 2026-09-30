"use client";

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The one easing token (`--ease-emphasized`), read from CSS so JS and CSS never drift apart. */
export function emphasizedEasing(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--ease-emphasized").trim() || "ease-out";
}
