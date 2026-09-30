import type { ReactNode } from "react";
import { type FeatureGroup, FeatureValueCells } from "@/components/plan-detail/feature-value-cells";
import { WidgetHeader } from "@/components/ui/widget-header";
import type { FeatureRow } from "@/lib/derive/types";
import { formatFeatureValue, getFeatureUnit } from "@/lib/format";

const GROUPS: Record<FeatureGroup, { title: string; description: string; columns: string[] }> = {
  credit: { title: "Credits", description: "What each action costs", columns: ["Feature", "Cost"] },
  capacity: {
    title: "Capacity",
    description: "Included, then billed or blocked",
    columns: ["Feature", "Included", "Past the limit"],
  },
  boolean: { title: "Access", description: "On or off", columns: ["Feature", "Availability"] },
};

type FeatureGroupTableProps = {
  group: FeatureGroup;
  icon: ReactNode;
  rows: FeatureRow[];
  currency: string;
  /** Set when viewing an older version: rows that differ show the current version's value. */
  currentVersion: number | null;
};

export function FeatureGroupTable({ group, icon, rows, currency, currentVersion }: FeatureGroupTableProps) {
  const { title, description, columns } = GROUPS[group];
  const headingId = `features-${group}-heading`;

  // Full height so the body colour fills the card when a neighbour in the row is taller.
  return (
    <section aria-labelledby={headingId} className="flex h-full flex-col overflow-hidden rounded-card border border-line">
      <WidgetHeader
        icon={icon}
        title={
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 id={headingId} className="font-medium">{title}</h3>
            <p className="text-caption text-ink-muted">{description}</p>
          </div>
        }
      />
      <div className="flex-1 overflow-x-auto bg-surface-card px-4 py-2">
        {rows.length === 0 ? (
          <p className="py-2 text-ink-muted">No {title.toLowerCase()} features in the catalog.</p>
        ) : (
          <table className="w-full text-left">
            <caption className="sr-only">{`${title}: ${description}`}</caption>
            <thead>
              <tr className="text-caption text-ink-muted">
                {columns.map((column, index) => (
                  <th key={column} scope="col" className={`py-1.5 font-normal ${index > 0 ? "pl-3" : ""}`}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {rows.map((row) => {
                const unit = getFeatureUnit(row.feature);
                return (
                  <tr key={row.feature.code} className="align-top">
                    <th scope="row" className="py-2 font-normal">
                      <span className="font-medium">{row.feature.name}</span>
                      {unit && group === "credit" && <span className="block text-caption text-ink-muted">per {unit}</span>}
                      {currentVersion !== null && row.differsFromCurrent && (
                        <span className="block text-caption text-ink-muted">
                          <span className="sr-only">Differs from the current version. </span>
                          v{currentVersion} today: {formatFeatureValue({ feature: row.feature, value: row.currentValue }, currency)}
                        </span>
                      )}
                    </th>
                    <FeatureValueCells row={row} group={group} currency={currency} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
