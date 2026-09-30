import type { LadderStep, PeriodPricing } from "@/lib/derive/types";
import { formatCompactNumber, formatMoney } from "@/lib/format";

type PlanMonthlyPriceProps = {
  monthly: PeriodPricing | null;
  step: LadderStep | null;
  currency: string;
};

/** Price per month, plus what moving up from the plan below costs and gives. */
export function PlanMonthlyPrice({ monthly, step, currency }: PlanMonthlyPriceProps) {
  if (!monthly) return <span className="text-ink-muted">No monthly price</span>;

  return (
    <div>
      <p className="tabular-nums">
        <span className="text-base font-semibold">{formatMoney(monthly.price, currency)}</span>
        <span className="text-ink-muted"> / mo</span>
      </p>
      {step && (
        <p className="text-caption text-ink-muted tabular-nums">
          +{formatMoney(step.priceDifference, currency)} · {step.creditsDifference >= 0 ? "+" : ""}
          {formatCompactNumber(step.creditsDifference)} credits vs {step.fromPlanName}
        </p>
      )}
    </div>
  );
}
