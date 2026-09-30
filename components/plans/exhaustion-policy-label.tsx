import { describeExhaustionPolicy, describePackOption } from "@/components/plans/describe-pack-option";
import type { ExhaustionPolicy } from "@/lib/catalog";
import type { PackComparison } from "@/lib/derive/types";

type ExhaustionPolicyLabelProps = {
  policy: ExhaustionPolicy;
  packComparison: PackComparison | null;
  currency: string;
};

/**
 * What happens when a customer runs out, next to the cheapest credit pack they could buy
 * instead, so it is visible when a pack beats paying overage.
 */
export function ExhaustionPolicyLabel({ policy, packComparison, currency }: ExhaustionPolicyLabelProps) {
  return (
    <div>
      <span className="tabular-nums">{describeExhaustionPolicy(policy, currency)}</span>
      <p className="text-caption text-ink-muted tabular-nums">
        {describePackOption(packComparison, currency)}
      </p>
    </div>
  );
}
