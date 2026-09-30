import { AvailabilityLabel } from "@/components/plan-detail/availability-label";
import { NotApplicable } from "@/components/ui/not-applicable";
import { isFeatureAvailable } from "@/lib/derive/compare-features";
import type { FeatureRow } from "@/lib/derive/types";
import { formatCapacityIncluded, formatCapacityOverage, formatCredits, getFeatureUnit } from "@/lib/format";

export type FeatureGroup = "credit" | "capacity" | "boolean";

type FeatureValueCellsProps = { row: FeatureRow; group: FeatureGroup; currency: string };

/**
 * The value cells of one feature row. An unavailable feature spans every value column, so
 * "Not included" reads as one statement rather than a row of blanks.
 */
export function FeatureValueCells({ row, group, currency }: FeatureValueCellsProps) {
  const { value, feature } = row;
  if (!isFeatureAvailable(value)) {
    return (
      <td colSpan={group === "capacity" ? 2 : 1} className="py-2 pl-3">
        <AvailabilityLabel isAvailable={false} />
      </td>
    );
  }
  if (value.kind === "credit") {
    return <td className="py-2 pl-3 tabular-nums">{formatCredits(value.creditsPerUnit)}</td>;
  }
  if (value.kind === "capacity") {
    const unit = getFeatureUnit(feature) ?? "unit";
    const overage = formatCapacityOverage(value.limit, unit, currency);
    return (
      <>
        <td className="py-2 pl-3 tabular-nums">{formatCapacityIncluded(value.limit, unit)}</td>
        <td className="py-2 pl-3 tabular-nums">{overage ?? <NotApplicable />}</td>
      </>
    );
  }
  return (
    <td className="py-2 pl-3">
      <AvailabilityLabel isAvailable />
    </td>
  );
}
