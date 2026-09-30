import { describeCatalogAlert } from "@/components/alerts/alert-copy";
import { InlineAlert } from "@/components/plan-detail/inline-alert";
import type { CatalogAlert } from "@/lib/derive/types";

type PlanAlertsProps = {
  alerts: CatalogAlert[];
  planName: string;
  planNames: Map<string, string>;
};

/** A section's own alerts, one compact line each, above its content. Nothing renders when there are none. */
export function PlanAlerts({ alerts, planName, planNames }: PlanAlertsProps) {
  if (alerts.length === 0) return null;
  return (
    <ul aria-label={`Alerts about ${planName}`} className="mb-3 space-y-2">
      {alerts.map((alert, index) => (
        <InlineAlert
          key={`${alert.type}-${index}`}
          severity={alert.severity}
          copy={describeCatalogAlert(alert, planNames)}
        />
      ))}
    </ul>
  );
}
