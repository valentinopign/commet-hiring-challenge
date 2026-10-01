import type { LadderStep, PeriodPricing } from "@/lib/derive/types";
import { formatCompactNumber, formatMoney, formatSavings } from "@/lib/format";

type PlanMonthlyPriceProps = {
  monthly: PeriodPricing | null;
  step: LadderStep | null;
  currency: string;
};

/** Price per month, plus what moving up from the plan below costs, gives and saves per credit. */
export function PlanMonthlyPrice({ monthly, step, currency }: PlanMonthlyPriceProps) {
  if (!monthly) return <span className="text-ink-muted">No monthly price</span>;

  return (
    <div>
      <p className="tabular-nums">
        <span className="text-2xl font-semibold tracking-tight">{formatMoney(monthly.price, currency)}</span>
        <span className="text-ink-muted"> / mo</span>
      </p>
      {step && (
        <p className="mt-0.5 text-caption text-ink-muted tabular-nums">
          +{formatMoney(step.priceDifference, currency)} · {step.creditsDifference >= 0 ? "+" : ""}
          {formatCompactNumber(step.creditsDifference)} credits
          {/* Left out against a free plan: its credits have no price to be cheaper than. */}
          {step.pricePerCreditSavings !== null && ` · ${formatSavings(step.pricePerCreditSavings)} per credit`}
          {" "}vs {step.fromPlanName}
        </p>
      )}
    </div>
  );
}
