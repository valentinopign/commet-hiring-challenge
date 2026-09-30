/**
 * Shared class lists for outline controls. Plain strings rather than components because the
 * same look goes on a <button>, a popover trigger and a Next <Link>, each with its own props.
 */

/**
 * On touch screens, a 44×44 hit area around a control that stays 32px to the eye. The container
 * must leave at least 12px between these controls so the extended areas never overlap.
 */
export const touchTargetClass =
  "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-11 pointer-coarse:after:-translate-1/2";

/** Square icon-only button, used in the top bar. Its accessible name comes from sr-only text. */
export const iconControlClass = `${touchTargetClass} relative inline-flex size-8 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink-muted transition-colors hover:border-line-strong hover:text-ink`;

/** Outline button with an icon and a label, used for section actions. */
export const outlineControlClass =
  "inline-flex items-center gap-1.5 rounded-control border border-line bg-surface-raised px-3 py-1.5 font-medium text-ink transition-colors hover:border-line-strong";

/** The one filled button per screen: the step's main action. Ink on sheet reads in both themes. */
export const primaryControlClass = `${touchTargetClass} relative inline-flex items-center justify-center gap-1.5 rounded-control bg-ink px-3.5 py-1.5 font-medium text-surface transition-opacity hover:opacity-90`;

/** Text inputs. 16px on phones so iOS does not zoom the page when a field gets focus. */
export const inputClass =
  "w-full rounded-control border border-line bg-surface-card px-3 py-2 text-base text-ink transition-colors placeholder:text-ink-muted hover:border-line-strong aria-invalid:border-critical sm:text-sm";

/** A radio option drawn as a card; the native radio inside stays visible, so the state is never colour alone. */
export const choiceCardClass =
  "flex cursor-pointer gap-3 rounded-card border border-line bg-surface-card p-3 transition-colors hover:border-line-strong has-checked:border-live has-checked:bg-live-soft";
