import { CoinsIcon } from "@/components/icons/coins-icon";
import { GaugeIcon } from "@/components/icons/gauge-icon";
import { UsersIcon } from "@/components/icons/users-icon";
import { StatCard } from "@/components/overview/stat-card";
import {
  describeExhaustionPolicy,
  describePackOption,
  formatPerThousand,
} from "@/components/plans/describe-pack-option";
import { NotApplicable } from "@/components/ui/not-applicable";
import type { PackComparison, PeriodPricing, PlanSummary } from "@/lib/derive/types";
import { formatMoney, formatNumber } from "@/lib/format";

type PlanPricingSummaryProps = {
  plan: PlanSummary;
  packComparison: PackComparison | null;
  currency: string;
};

/** Monthly and yearly are shown as the data states them; neither is derived from the other. */
function describePeriod(period: PeriodPricing, currency: string): string {
  const credits = `${formatNumber(period.includedCredits)} credits`;
  if (period.price === 0) return `${credits}, at no charge`;
  if (period.pricePerThousandCredits === null) return credits;
  return `${credits} · ${formatPerThousand(period.pricePerThousandCredits, currency)}`;
}

function describeCustomers(plan: PlanSummary): string {
  if (plan.totalSubscriptions === 0) return "No customers yet";
  if (plan.versionSplit.length === 1) return `All on v${plan.currentReleaseVersion}, the only version`;
  const current = plan.versionSplit.find((share) => share.isCurrent);
  const onCurrent = current?.subscriptions ?? 0;
  return `${formatNumber(onCurrent)} on v${plan.currentReleaseVersion}, the current version`;
}

export function PlanPricingSummary({ plan, packComparison, currency }: PlanPricingSummaryProps) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<UsersIcon />}
        label="Customers"
        value={formatNumber(plan.totalSubscriptions)}
        detail={describeCustomers(plan)}
      />
      <StatCard
        icon={<CoinsIcon />}
        label="Monthly"
        value={plan.monthly ? `${formatMoney(plan.monthly.price, currency)} / mo` : <NotApplicable />}
        detail={plan.monthly ? describePeriod(plan.monthly, currency) : "No monthly price"}
      />
      <StatCard
        icon={<CoinsIcon />}
        label="Yearly"
        value={plan.yearly ? `${formatMoney(plan.yearly.price, currency)} / yr` : <NotApplicable />}
        detail={plan.yearly ? describePeriod(plan.yearly, currency) : "No yearly price"}
      />
      <StatCard
        icon={<GaugeIcon />}
        label="When credits run out"
        value={describeExhaustionPolicy(plan.exhaustionPolicy, currency)}
        detail={describePackOption(packComparison, currency)}
      />
    </dl>
  );
}
