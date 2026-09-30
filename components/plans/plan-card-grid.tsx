import type { CSSProperties } from "react";
import { describeCatalogAlert } from "@/components/alerts/alert-copy";
import { PlanCard } from "@/components/plans/plan-card";
import type { CatalogAlert, LadderRow } from "@/lib/derive/types";

type PlanCardGridProps = {
  rows: LadderRow[];
  /** Alerts that need attention; each card picks the ones about its plan. */
  alerts: CatalogAlert[];
  planNames: Map<string, string>;
  currency: string;
};

/**
 * All plans side by side, cheapest first, so they can be compared by reading across.
 * From `md` up every card gets a column with a minimum width; when they don't fit, the
 * row scrolls inside its own box rather than squeezing cards or scrolling the page.
 */
export function PlanCardGrid({ rows, alerts, planNames, currency }: PlanCardGridProps) {
  if (rows.length === 0) {
    return <p className="text-ink-muted">No plans yet. Create one to start charging customers.</p>;
  }

  // CSS custom properties are not in React's style typings; the cast only adds this one key.
  const columnCount = { "--plan-count": rows.length } as CSSProperties;

  return (
    // The padding leaves room for the focus ring, which the scroll box would otherwise clip.
    <div className="-m-1 overflow-x-auto p-1">
      <ol
        style={columnCount}
        className="grid grid-cols-1 gap-3 md:grid-cols-[repeat(var(--plan-count),minmax(11.5rem,1fr))]"
      >
        {rows.map((row) => (
          <PlanCard
            key={row.plan.code}
            row={row}
            currency={currency}
            alerts={alerts
              .filter((alert) => alert.planCode === row.plan.code)
              .map((alert) => describeCatalogAlert(alert, planNames))}
          />
        ))}
      </ol>
    </div>
  );
}
