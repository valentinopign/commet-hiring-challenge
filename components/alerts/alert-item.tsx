import Link from "@/components/organizations/catalog-link";
import type { ReactNode } from "react";
import type { AlertCopy } from "@/components/alerts/alert-copy";
import { CriticalIcon } from "@/components/icons/critical-icon";
import { InfoIcon } from "@/components/icons/info-icon";
import { WarningIcon } from "@/components/icons/warning-icon";
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
};

/** A single tinted row for the alerts popover: the title, and a link to the plan it concerns. */
export function AlertItem({ severity, copy, planCode, planName }: AlertItemProps) {
  const style = SEVERITY_STYLES[severity];
  // An orphan subscription row can name a plan that does not exist: nothing to link to.
  const planLink = planName ? `/plans/${planCode}` : null;

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
