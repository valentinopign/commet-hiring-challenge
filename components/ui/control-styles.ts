/**
 * Shared class lists for outline controls. Plain strings rather than components because the
 * same look goes on a <button>, a popover trigger and a Next <Link>, each with its own props.
 */

/** Square icon-only button, used in the top bar. Its accessible name comes from sr-only text. */
export const iconControlClass =
  "relative inline-flex size-8 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink-muted transition-colors hover:border-line-strong hover:text-ink";

/** Outline button with an icon and a label, used for section actions. */
export const outlineControlClass =
  "inline-flex items-center gap-1.5 rounded-control border border-line bg-surface-raised px-3 py-1.5 font-medium text-ink transition-colors hover:border-line-strong";
