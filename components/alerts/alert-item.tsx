import Link from "next/link";
import type { ReactNode } from "react";
import type { AlertCopy } from "@/components/alerts/alert-copy";
import { CriticalIcon } from "@/components/icons/critical-icon";
import { InfoIcon } from "@/components/icons/info-icon";
import { WarningIcon } from "@/components/icons/warning-icon";
import type { Severity } from "@/lib/derive/types";

const SEVERITY_STYLES: Record<Severity, { label: string; container: string; icon: ReactNode }> = {
  critical: {
    label: "Data problem",
    container: "border-critical/30 bg-critical-soft text-critical",
    icon: <CriticalIcon />,
  },
  warning: {
    label: "Warning",
    container: "border-warning/30 bg-warning-soft text-warning",
    icon: <WarningIcon />,
  },
  info: {
    label: "Note",
    container: "border-info/25 bg-info-soft text-info",
    icon: <InfoIcon />,
  },
};

type AlertItemProps = {
  severity: Severity;
  copy: AlertCopy;
  planCode: string;
  planName: string | undefined;
  /** Drops the explanation and tightens spacing, for the alerts popover. */
  compact?: boolean;
};

export function AlertItem({ severity, copy, planCode, planName, compact = false }: AlertItemProps) {
  const style = SEVERITY_STYLES[severity];
  return (
    <li className={`flex gap-3 rounded-md border ${compact ? "px-3 py-2" : "px-4 py-2.5"} ${style.container}`}>
      <span className="mt-0.5">{style.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          <span className="sr-only">{style.label}: </span>
          {copy.title}
        </p>
        <p className="text-ink">
          {!compact && <>{copy.detail} </>}
          {/* An orphan subscription row can name a plan that does not exist: nothing to link to. */}
          {planName && (
            <Link
              href={`/plans/${planCode}`}
              className="font-medium whitespace-nowrap underline underline-offset-2 hover:no-underline"
            >
              View {planName}
            </Link>
          )}
        </p>
      </div>
    </li>
  );
}
