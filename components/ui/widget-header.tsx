import type { ReactNode } from "react";

type WidgetHeaderProps = {
  icon?: ReactNode;
  /** The caller picks the element (a heading, a <dt>…) so the document outline stays correct. */
  title: ReactNode;
  /** Right-aligned marker or action, such as an arrow to the detail page. */
  trailing?: ReactNode;
  /** Replaces the default raised background, e.g. with an alert tint. */
  tone?: string;
};

/**
 * The top layer of a two-layer card: slightly lighter than the body below it, so the card
 * reads as nested inside the sheet.
 */
export function WidgetHeader({ icon, title, trailing, tone = "bg-surface-raised" }: WidgetHeaderProps) {
  return (
    <div className={`flex min-w-0 items-center gap-2 border-b border-line px-3.5 py-2 ${tone}`}>
      {icon}
      <div className="min-w-0 flex-1">{title}</div>
      {trailing}
    </div>
  );
}
