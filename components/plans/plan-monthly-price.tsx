import type { LadderStep, PeriodPricing } from "@/lib/derive/types";
import { formatMoney, formatSavings } from "@/lib/format";

type PlanMonthlyPriceProps = {
  monthly: PeriodPricing | null;
  step: LadderStep | null;
  currency: string;
};

/** Price per month, with only the per-credit comparison against the plan below. */
export function PlanMonthlyPrice({ monthly, step, currency }: PlanMonthlyPriceProps) {
  if (!monthly) return <span className="text-ink-muted">No monthly price</span>;

  return (
    <div>
      <p className="tabular-nums">
        <span className="text-2xl font-semibold tracking-tight">{formatMoney(monthly.price, currency)}</span>
        <span className="text-ink-muted"> / mo</span>
      </p>
      {step && step.pricePerCreditSavings !== null && (
        <p className="mt-0.5 text-caption text-ink-muted tabular-nums">
          {formatSavings(step.pricePerCreditSavings)} per credit
          {" "}vs {step.fromPlanName}
        </p>
      )}
    </div>
  );
}
