import type { Catalog } from "@/lib/catalog";
import { CoinsIcon } from "@/components/icons/coins-icon";
import { GaugeIcon } from "@/components/icons/gauge-icon";
import { UsersIcon } from "@/components/icons/users-icon";
import { ComparisonCard } from "@/components/plan-detail/comparison-card";
import { ComparisonCustomersValue } from "@/components/plan-detail/comparison-customers-value";
import { ComparisonExhaustionValue } from "@/components/plan-detail/comparison-exhaustion-value";
import { ComparisonPeriodValue } from "@/components/plan-detail/comparison-period-value";
import type { PlanDetail } from "@/lib/derive/types";
import { comparePlanContext } from "@/lib/derive/compare-plans";

type Props = { catalog: Catalog; left: PlanDetail; right: PlanDetail; leftLabel: string; rightLabel: string; currency: string; planNames: Map<string, string> };

export function ComparisonPricing({ catalog, left, right, leftLabel, rightLabel, currency, planNames }: Props) {
  const labels = { leftLabel, rightLabel };
  const differences = comparePlanContext(catalog, left, right);
  return <dl className="grid grid-cols-1 gap-3 lg:grid-cols-2">
    <ComparisonCard {...labels} title="Customers" icon={<UsersIcon />}
      left={<ComparisonCustomersValue detail={left} />}
      right={<ComparisonCustomersValue detail={right} customerDelta={differences.customerDelta} />} />
    <ComparisonCard {...labels} title="Monthly" icon={<CoinsIcon />} left={<ComparisonPeriodValue period={left.plan.monthly} currency={currency} />} right={<ComparisonPeriodValue period={right.plan.monthly} baseline={left.plan.monthly} currency={currency} />} />
    <ComparisonCard {...labels} title="Yearly" icon={<CoinsIcon />} left={<ComparisonPeriodValue period={left.plan.yearly} currency={currency} />} right={<ComparisonPeriodValue period={right.plan.yearly} baseline={left.plan.yearly} currency={currency} />} />
    <ComparisonCard {...labels} title="When credits run out" icon={<GaugeIcon />}
      left={<ComparisonExhaustionValue detail={left} currency={currency} planNames={planNames} />}
      right={<ComparisonExhaustionValue detail={right} currency={currency} planNames={planNames} policyDiffers={differences.policyDiffers} policyImpact={differences.policyImpact} packDiffers={differences.packDiffers} />} />
  </dl>;
}
