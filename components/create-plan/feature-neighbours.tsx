import { ArrowDownIcon } from "@/components/icons/arrow-down-icon";
import { InfoIcon } from "@/components/icons/info-icon";
import type { CatalogFeature } from "@/lib/catalog";
import type { FeatureComparison } from "@/lib/derive/draft-flow";
import { formatFeatureValue } from "@/lib/format";

type FeatureNeighboursProps = {
  feature: CatalogFeature;
  comparison: FeatureComparison;
  currency: string;
};

/**
 * The same feature on the plans around the draft, and a mark the moment it breaks the ladder:
 * worse than a cheaper plan (paying more for less) or better than a pricier one (possibly
 * intended, so only informative). The same rule as `checkDraftPlan`.
 */
export function FeatureNeighbours({ feature, comparison, currency }: FeatureNeighboursProps) {
  const { below, above } = comparison;
  if (!below && !above) return null;
  const value = (neighbour: NonNullable<FeatureComparison["below"]>) =>
    formatFeatureValue({ feature, value: neighbour.value }, currency);

  return (
    <div className="space-y-1 text-caption">
      <p className="text-ink-muted">
        {below && <>{below.planName} (costs less): {value(below)}</>}
        {below && above && <span aria-hidden="true"> · </span>}
        {below && above && <span className="sr-only">. </span>}
        {above && <>{above.planName} (costs more): {value(above)}</>}
      </p>
      {below?.draftImpact === "worse" && (
        <p className="flex items-center gap-1.5 font-medium text-impact-worse">
          <ArrowDownIcon className="size-3.5 shrink-0" />
          Worse than {below.planName}, which costs less
        </p>
      )}
      {above?.draftImpact === "better" && (
        <p className="flex items-center gap-1.5 font-medium text-info">
          <InfoIcon className="size-3.5 shrink-0" />
          Better than {above.planName}, which costs more
        </p>
      )}
    </div>
  );
}
