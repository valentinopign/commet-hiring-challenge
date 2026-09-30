import type { ReactNode } from "react";
import { describeDraftWarning } from "@/components/create-plan/describe-draft-warning";
import { CriticalIcon } from "@/components/icons/critical-icon";
import { InfoIcon } from "@/components/icons/info-icon";
import { WarningIcon } from "@/components/icons/warning-icon";
import type { DraftWarning, DraftWarningSeverity } from "@/lib/derive/types";

/** The label is visible text, so the severity never depends on the tint. */
const SEVERITY_STYLES: Record<DraftWarningSeverity, { label: string; text: string; box: string; icon: ReactNode }> = {
  blocking: { label: "Must fix", text: "text-critical", box: "border-critical/35 bg-critical-soft", icon: <CriticalIcon /> },
  warning: { label: "Warning", text: "text-warning", box: "border-warning/35 bg-warning-soft", icon: <WarningIcon /> },
  info: { label: "Note", text: "text-info", box: "border-info/30 bg-info-soft", icon: <InfoIcon /> },
};

type DraftWarningListProps = {
  warnings: DraftWarning[];
  planNames: Map<string, string>;
  currency: string;
  label: string;
};

/** Checks shown inside a step, as the values change. Nothing renders when there are none. */
export function DraftWarningList({ warnings, planNames, currency, label }: DraftWarningListProps) {
  if (warnings.length === 0) return null;
  return (
    <ul aria-label={label} className="space-y-2">
      {warnings.map((warning, index) => {
        const style = SEVERITY_STYLES[warning.severity];
        const copy = describeDraftWarning(warning, planNames, currency);
        return (
          <li key={`${warning.type}-${index}`} className={`flex gap-2.5 rounded-control border px-3 py-2 ${style.box}`}>
            <span className={`mt-0.5 ${style.text}`}>{style.icon}</span>
            <div className="min-w-0">
              <p className="font-medium">
                <span className={`${style.text} mr-1.5`}>{style.label}:</span>
                {copy.title}
              </p>
              <p className="text-caption text-ink-muted">{copy.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
