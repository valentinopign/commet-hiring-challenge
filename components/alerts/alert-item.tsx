import Link from "next/link";
import type { ReactNode } from "react";
import type { AlertCopy } from "@/components/alerts/alert-copy";
import { ArrowUpRightIcon } from "@/components/icons/arrow-up-right-icon";
import { CriticalIcon } from "@/components/icons/critical-icon";
import { InfoIcon } from "@/components/icons/info-icon";
import { WarningIcon } from "@/components/icons/warning-icon";
import { WidgetHeader } from "@/components/ui/widget-header";
import type { Severity } from "@/lib/derive/types";

/** The label is visible text, so severity is never carried by the tint alone. */
const SEVERITY_STYLES: Record<Severity, { label: string; text: string; border: string; tint: string; icon: ReactNode }> = {
  critical: {
    label: "Data problem",
    text: "text-critical",
    border: "border-critical/35",
    tint: "bg-critical-soft",
    icon: <CriticalIcon />,
  },
  warning: {
    label: "Warning",
    text: "text-warning",
    border: "border-warning/35",
    tint: "bg-warning-soft",
    icon: <WarningIcon />,
  },
  info: {
    label: "Note",
    text: "text-info",
    border: "border-info/30",
    tint: "bg-info-soft",
    icon: <InfoIcon />,
  },
};

type AlertItemProps = {
  severity: Severity;
  copy: AlertCopy;
  planCode: string;
  planName: string | undefined;
  /** A single tinted row without the explanation, for the alerts popover. */
  compact?: boolean;
};

export function AlertItem({ severity, copy, planCode, planName, compact = false }: AlertItemProps) {
  const style = SEVERITY_STYLES[severity];
  // An orphan subscription row can name a plan that does not exist: nothing to link to.
  const planLink = planName ? `/plans/${planCode}` : null;

  if (compact) {
    return (
      <li className={`flex gap-2.5 rounded-control border px-3 py-2 ${style.border} ${style.tint}`}>
        <span className={`mt-0.5 ${style.text}`}>{style.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            <span className="sr-only">{style.label}: </span>
            {copy.title}
          </p>
          {planLink && (
            <Link href={planLink} className="text-caption text-ink-muted underline underline-offset-2 hover:text-ink">
              View {planName}
            </Link>
          )}
        </div>
      </li>
    );
  }

  return (
    <li className={`overflow-hidden rounded-card border ${style.border}`}>
      <WidgetHeader
        tone={style.tint}
        icon={<span className={style.text}>{style.icon}</span>}
        title={<p className={`text-caption font-medium ${style.text}`}>{style.label}</p>}
        trailing={
          planLink && (
            <Link
              href={planLink}
              className="inline-flex items-center gap-1 text-caption font-medium text-ink-muted hover:text-ink"
            >
              View {planName}
              <ArrowUpRightIcon className="size-3.5 shrink-0" />
            </Link>
          )
        }
      />
      <div className="bg-surface-sunken px-3.5 py-2.5">
        <p className="font-medium">{copy.title}</p>
        <p className="text-ink-muted">{copy.detail}</p>
      </div>
    </li>
  );
}
