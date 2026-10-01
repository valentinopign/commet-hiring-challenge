import { ComparisonDifference } from "@/components/plan-detail/comparison-difference";
import { formatPerThousand } from "@/components/plans/describe-pack-option";
import { NotApplicable } from "@/components/ui/not-applicable";
import { comparePeriodPricing, numericComparisonImpact } from "@/lib/derive/compare-plans";
import type { PeriodPricing } from "@/lib/derive/types";
import { formatCredits, formatMoney } from "@/lib/format";

export function ComparisonPeriodValue({ period, currency, baseline }: { period: PeriodPricing | null; currency: string; baseline?: PeriodPricing | null }) {
  const delta = baseline === undefined ? null : comparePeriodPricing(baseline, period);
  const interval = period?.interval === "yearly" ? "yr" : "mo";
  return <>
    <p className="text-stat font-medium tabular-nums">{period ? `${formatMoney(period.price, currency)} / ${interval}` : <NotApplicable />}</p>
    <p className="mt-1 text-caption text-ink-muted">{period ? formatCredits(period.includedCredits) : "Not offered"}</p>
    {period && <p className="mt-1 text-caption text-ink-muted">{period.pricePerThousandCredits !== null ? formatPerThousand(period.pricePerThousandCredits, currency) : "No included credit unit price"}</p>}
    {delta && <ul className="mt-2 space-y-1 text-caption text-ink-muted">
      {delta.availabilityDiffers && <li><ComparisonDifference>{period ? "Billing period added" : "Billing period not offered"}</ComparisonDifference></li>}
      {delta.priceDelta !== null && delta.priceDelta !== 0 && <li><ComparisonDifference impact={numericComparisonImpact(delta.priceDelta, "lower")}>{formatMoney(Math.abs(delta.priceDelta), currency)} {delta.priceDelta > 0 ? "more" : "less"} / {interval}</ComparisonDifference></li>}
      {delta.creditsDelta !== null && delta.creditsDelta !== 0 && <li><ComparisonDifference impact={numericComparisonImpact(delta.creditsDelta, "higher")}>{formatCredits(Math.abs(delta.creditsDelta))} {delta.creditsDelta > 0 ? "more" : "fewer"}</ComparisonDifference></li>}
      {delta.unitCostDelta !== null && delta.unitCostDelta !== 0 && <li><ComparisonDifference impact={numericComparisonImpact(delta.unitCostDelta, "lower")}>{formatMoney(Math.abs(delta.unitCostDelta), currency)} {delta.unitCostDelta > 0 ? "more" : "less"} / 1,000 credits</ComparisonDifference></li>}
    </ul>}
  </>;
}
