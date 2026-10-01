import type { ReactNode } from "react";
import type { AlertCopy } from "@/components/alerts/alert-copy";
import { ChevronRightIcon } from "@/components/icons/chevron-right-icon";
import { CriticalIcon } from "@/components/icons/critical-icon";
import { InfoIcon } from "@/components/icons/info-icon";
import { WarningIcon } from "@/components/icons/warning-icon";
import type { Severity } from "@/lib/derive/types";

/** The label is read by screen readers; sighted users get the icon and the tint with the text. */
const SEVERITY_STYLES: Record<Severity, { label: string; text: string; box: string; icon: ReactNode }> = {
  critical: { label: "Data problem", text: "text-critical", box: "border-critical/35 bg-critical-soft", icon: <CriticalIcon /> },
  warning: { label: "Warning", text: "text-warning", box: "border-warning/35 bg-warning-soft", icon: <WarningIcon /> },
  info: { label: "Note", text: "text-info", box: "border-info/30 bg-info-soft", icon: <InfoIcon /> },
};

type InlineAlertProps = { severity: Severity; copy: AlertCopy; action?: ReactNode };

/**
 * One compact line inside the section it explains. When there is more to say (how the situation
 * came about), "Why" folds it into a native disclosure, animated like the sidebar's.
 */
export function InlineAlert({ severity, copy, action }: InlineAlertProps) {
  const style = SEVERITY_STYLES[severity];
  const line = (
    <>
      <span className={`mt-0.5 ${style.text}`}>{style.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="sr-only">{style.label}: </span>
        <span className="font-medium">{copy.title}.</span> <span className="text-ink-muted">{copy.detail}</span>
      </span>
    </>
  );

  return (
    <li className={`rounded-control border px-3 py-2 ${style.box}`}>
      {copy.context ? (
        <details className="group/why disclosure-animated">
          <summary className="flex cursor-pointer list-none items-start gap-2.5 [&::-webkit-details-marker]:hidden">
            {line}
            <span className="flex shrink-0 items-center gap-1 text-caption font-medium text-ink-muted group-hover/why:text-ink">
              Why
              <ChevronRightIcon className="size-3.5 shrink-0 transition-transform duration-150 ease-emphasized group-open/why:rotate-90 group-open/why:duration-200 motion-reduce:transition-none" />
            </span>
          </summary>
          <p className="mt-1 pl-6.5 text-caption text-ink-muted">{copy.context}</p>
        </details>
      ) : (
        <p className="flex items-start gap-2.5">{line}</p>
      )}
      {action && <div className="pl-6.5">{action}</div>}
    </li>
  );
}
