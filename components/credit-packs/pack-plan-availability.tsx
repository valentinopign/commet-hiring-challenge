import type { PackPlanComparison } from "@/lib/derive/types";
import { formatMoney, formatSavings } from "@/lib/format";

type PackPlanAvailabilityProps = {
  plans: PackPlanComparison[];
  currency: string;
};

/** Where a pack can be bought, and whether it beats that plan's overage. */
export function PackPlanAvailability({ plans, currency }: PackPlanAvailabilityProps) {
  const available = plans.filter((plan) => plan.isAvailable);
  const unavailable = plans.filter((plan) => !plan.isAvailable);

  return (
    <div className="flex flex-1 flex-col">
      {available.length === 0 ? (
        <p className="flex-1 text-ink-muted">Not available on any plan.</p>
      ) : (
        <ul className="flex-1 space-y-2">
          {available.map((plan) => (
            <li key={plan.planCode}>
              <span className="font-medium">{plan.planName}</span>
              <p className="text-caption text-ink-muted tabular-nums">{describeAgainstPlan(plan, currency)}</p>
            </li>
          ))}
        </ul>
      )}
      {unavailable.length > 0 && (
        <p className="mt-3 text-caption text-ink-muted">
          Not available on {unavailable.map((plan) => plan.planName).join(", ")}
        </p>
      )}
    </div>
  );
}

function describeAgainstPlan(plan: PackPlanComparison, currency: string): string {
  if (plan.exhaustionPolicy.type === "block") {
    return "Service stops at zero, so a pack is the only way to keep going without upgrading";
  }
  const overage = `${formatMoney(plan.exhaustionPolicy.pricePer1000Credits, currency)} overage`;
  return plan.savingsVersusOverage === null
    ? `Overage is ${overage}`
    : formatSavings(plan.savingsVersusOverage, overage);
}
