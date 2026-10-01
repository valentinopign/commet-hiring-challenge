import type { ReactNode } from "react";
import { AvailabilityLabel } from "@/components/plan-detail/availability-label";
import { ImpactLabel } from "@/components/plan-detail/impact-label";
import { WidgetHeader } from "@/components/ui/widget-header";
import type { ComparisonFeatureRow } from "@/lib/derive/compare-plans";
import type { FeatureValue } from "@/lib/derive/types";
import { formatFeatureValue } from "@/lib/format";

type Props = { group: "credit" | "capacity" | "boolean"; icon: ReactNode; rows: ComparisonFeatureRow[]; leftLabel: string; rightLabel: string; currency: string; onlyDifferences: boolean };
const GROUPS = {
  credit: { title: "Credits", description: "What each action costs" },
  capacity: { title: "Capacity", description: "Included, then billed or blocked" },
  boolean: { title: "Access", description: "On or off" },
};

export function ComparisonFeatureTable({ group, icon, rows, leftLabel, rightLabel, currency, onlyDifferences }: Props) {
  const { title, description } = GROUPS[group];
  const value = (row: ComparisonFeatureRow, featureValue: FeatureValue) => featureValue.kind === "boolean" || featureValue.kind === "not_included"
    ? <AvailabilityLabel isAvailable={featureValue.kind === "boolean" && featureValue.enabled} />
    : formatFeatureValue({ feature: row.feature, value: featureValue }, currency);
  return <section data-comparison-card aria-labelledby={`compare-${group}-heading`} className="overflow-hidden rounded-card border border-line">
    <WidgetHeader icon={icon} title={<div className="flex flex-wrap items-baseline gap-x-2"><h3 id={`compare-${group}-heading`} className="font-medium">{title}</h3><p className="text-caption text-ink-muted">{description}</p></div>} />
    <div className="bg-surface-card px-4 py-2">
      {rows.length === 0 ? <p className="py-3 text-ink-muted">{onlyDifferences ? `No differences in ${title.toLowerCase()}.` : `No ${title.toLowerCase()} features in the catalog.`}</p> : <table role="table" className="block w-full text-left sm:table sm:table-fixed">
        <caption className="sr-only">{title}: {leftLabel} compared with {rightLabel}. Impact labels describe the right plan relative to the left plan.</caption>
        <thead role="rowgroup" className="sr-only sm:not-sr-only sm:table-header-group">
          <tr role="row" className="text-caption text-ink-muted">
            <th role="columnheader" scope="col" className="w-[30%] py-2 font-normal">Feature</th>
            <th role="columnheader" scope="col" className="w-[35%] border-l border-line px-3 py-2 font-medium">{leftLabel}</th>
            <th role="columnheader" scope="col" className="w-[35%] border-l border-line px-3 py-2 font-medium"><span data-comparison-value className="block">{rightLabel}</span></th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="block divide-y divide-line border-t border-line sm:table-row-group">
          {rows.map((row) => <tr role="row" key={row.feature.code} className="block align-top sm:table-row">
            <th role="rowheader" scope="row" className="block border-b-2 border-line-strong pt-3 pb-2 font-medium sm:table-cell sm:border-b-0 sm:py-3 sm:pr-3">{row.feature.name}</th>
            <td role="cell" className="block py-3 sm:table-cell sm:border-l sm:border-line sm:px-3">
              <span className="mb-1 block text-sm font-semibold text-ink sm:hidden">{leftLabel}</span>
              <span className="block tabular-nums">{value(row, row.value)}</span>
            </td>
            <td role="cell" className="block border-t border-line py-3 sm:table-cell sm:border-t-0 sm:border-l sm:px-3">
              <div data-comparison-value>
              <span className="mb-1 block text-sm font-semibold text-ink sm:hidden">{rightLabel}</span>
              <span className={`block tabular-nums ${row.impact === "better" ? "text-impact-better" : row.impact === "worse" ? "text-impact-worse" : ""}`}>{value(row, row.comparedValue)}</span>
              {row.impact !== null && <span className="mt-1 block"><ImpactLabel impact={row.impact} /></span>}
              </div>
            </td>
          </tr>)}
        </tbody>
      </table>}
    </div>
  </section>;
}
