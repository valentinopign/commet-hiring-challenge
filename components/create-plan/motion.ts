"use client";

import { createContext, type RefObject } from "react";

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The one easing token (`--ease-emphasized`), read from CSS so JS and CSS never drift apart. */
export function emphasizedEasing(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--ease-emphasized").trim() || "ease-out";
}

/**
 * `true` once the current step has finished mounting. Content that appears because of a choice
 * animates in; content that is simply there when the step opens does not, since the step's own
 * entrance already covers it. Outside a step, everything counts as settled.
 */
export const StepSettledContext = createContext<RefObject<boolean>>({ current: true });
