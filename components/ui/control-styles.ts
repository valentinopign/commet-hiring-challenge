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

/**
 * Press feedback: a button gives a little under the finger (scale 0.96) and springs back, 150ms.
 * The transition names every property it animates, so colour changes and the press share it.
 * Reduced motion keeps the colour changes and drops the press.
 */
const pressClass =
  "transition-[color,background-color,border-color,opacity,scale] duration-150 ease-emphasized active:scale-[0.96] disabled:active:scale-100 motion-reduce:active:scale-100";

/** Square icon-only button, used in the top bar. Its accessible name comes from sr-only text. */
export const iconControlClass = `${touchTargetClass} ${pressClass} relative inline-flex size-8 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink`;

const outlineBaseClass = `${pressClass} inline-flex items-center gap-1.5 rounded-control border border-line bg-surface-raised py-1.5 font-medium text-ink hover:border-line-strong`;

/** Outline button with a label, used for secondary actions. */
export const outlineControlClass = `${outlineBaseClass} px-3`;

/**
 * Outline button that starts with an icon ("+ Create plan"). The icon's own side gets 2px less
 * padding: the glyph carries empty space inside its box, so equal padding looks unbalanced.
 */
export const outlineIconControlClass = `${outlineBaseClass} pr-3 pl-2.5`;

/** The one filled button per screen: the step's main action. Ink on sheet reads in both themes. */
export const primaryControlClass = `${touchTargetClass} ${pressClass} relative inline-flex items-center justify-center gap-1.5 rounded-control bg-ink px-3.5 py-1.5 font-medium text-surface hover:opacity-90`;

/** Text inputs. 16px on phones so iOS does not zoom the page when a field gets focus. */
export const inputClass =
  "w-full rounded-control border border-line bg-surface-card px-3 py-2 text-base text-ink transition-colors placeholder:text-ink-muted hover:border-line-strong aria-invalid:border-critical sm:text-sm";

/** A radio option drawn as a card; the native radio inside stays visible, so the state is never colour alone. */
export const choiceCardClass =
  "flex cursor-pointer gap-3 rounded-card border border-line bg-surface-card p-3 transition-colors hover:border-line-strong has-checked:border-live has-checked:bg-live-soft";
