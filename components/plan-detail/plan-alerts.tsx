import { describeCatalogAlert } from "@/components/alerts/alert-copy";
import { InlineAlert } from "@/components/plan-detail/inline-alert";
import type { CatalogAlert } from "@/lib/derive/types";
import type { ScheduledMigration } from "@/lib/edit-plan/publication";
import { formatNumber } from "@/lib/format";
import { MigrationEntryLink } from "./migration-entry-link";

type PlanAlertsProps = {
  alerts: CatalogAlert[];
  planName: string;
  planNames: Map<string, string>;
  schedules?: readonly ScheduledMigration[];
};

/** A section's own alerts, one compact line each, above its content. Nothing renders when there are none. */
export function PlanAlerts({ alerts, planName, planNames, schedules = [] }: PlanAlertsProps) {
  if (alerts.length === 0) return null;
  return (
    <ul aria-label={`Alerts about ${planName}`} className="mb-3 space-y-2">
      {alerts.map((alert, index) => (
        <InlineAlert
          key={`${alert.type}-${index}`}
          severity={alert.severity}
          action={alert.type === "majority_on_retired" ? <MigrationEntryLink planCode={alert.planCode} currentVersion={alert.currentReleaseVersion} /> : undefined}
          copy={alert.type === "majority_on_retired" && schedules.some((item) => item.planCode === alert.planCode) ? (() => {
            const relevant = schedules.filter((item) => item.planCode === alert.planCode);
            const count = relevant.reduce((total, item) => total + item.customers, 0);
            const destinations = [...new Set(relevant.map((item) => `v${item.toVersion}`))].join(", ");
            return { title: `${formatNumber(count)} of ${formatNumber(alert.totalSubscriptions)} are scheduled to move to ${destinations} at renewal`,
              short: `${formatNumber(count)} scheduled to move`,
              detail: `${formatNumber(alert.retiredSubscriptions - count)} customers on retired versions are staying on their version.`,
              context: "These moves are scheduled, not completed. Customer counts and version bars continue to show current subscriptions until renewal." };
          })() : describeCatalogAlert(alert, planNames)}
        />
      ))}
    </ul>
  );
}
