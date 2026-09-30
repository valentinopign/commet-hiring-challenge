import { describeCatalogAlert } from "@/components/alerts/alert-copy";
import { AlertItem } from "@/components/alerts/alert-item";
import { CheckIcon } from "@/components/icons/check-icon";
import { needsAttention } from "@/lib/derive/alerts";
import type { CatalogAlert } from "@/lib/derive/types";

type AlertListProps = {
  alerts: CatalogAlert[];
  planNames: Map<string, string>;
};

/** Warnings stay open; informational notes are folded so they don't compete with them. */
export function AlertList({ alerts, planNames }: AlertListProps) {
  const pending = alerts.filter(needsAttention);
  const notes = alerts.filter((alert) => !needsAttention(alert));

  const renderAlert = (alert: CatalogAlert, index: number) => (
    <AlertItem
      key={`${alert.type}-${alert.planCode}-${index}`}
      severity={alert.severity}
      copy={describeCatalogAlert(alert, planNames)}
      planCode={alert.planCode}
      planName={planNames.get(alert.planCode)}
    />
  );

  return (
    <div className="space-y-2">
      {pending.length > 0 ? (
        <ul className="space-y-2">{pending.map(renderAlert)}</ul>
      ) : (
        <p className="flex items-center gap-2 text-ink-muted">
          <CheckIcon className="size-4 shrink-0" />
          Nothing needs attention in the catalog.
        </p>
      )}
      {notes.length > 0 && (
        <details>
          <summary className="cursor-pointer text-ink-muted hover:text-ink">
            {notes.length} {notes.length === 1 ? "note" : "notes"} for reference
          </summary>
          <ul className="mt-2 space-y-2">{notes.map(renderAlert)}</ul>
        </details>
      )}
    </div>
  );
}
