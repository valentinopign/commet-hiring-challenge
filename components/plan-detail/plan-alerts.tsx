import { describeCatalogAlert } from "@/components/alerts/alert-copy";
import { AlertItem } from "@/components/alerts/alert-item";
import type { CatalogAlert } from "@/lib/derive/types";

type PlanAlertsProps = {
  alerts: CatalogAlert[];
  planName: string;
  planNames: Map<string, string>;
};

/** The plan's own alerts, open and with their full explanation. Nothing renders when there are none. */
export function PlanAlerts({ alerts, planName, planNames }: PlanAlertsProps) {
  if (alerts.length === 0) return null;
  return (
    <ul aria-label={`Alerts about ${planName}`} className="mt-5 space-y-2">
      {alerts.map((alert, index) => (
        <AlertItem
          key={`${alert.type}-${index}`}
          severity={alert.severity}
          copy={describeCatalogAlert(alert, planNames)}
          planCode={alert.planCode}
          planName={planName}
          linkToPlan={false}
        />
      ))}
    </ul>
  );
}
