import { describeCatalogAlert } from "@/components/alerts/alert-copy";
import { CoinsIcon } from "@/components/icons/coins-icon";
import { GaugeIcon } from "@/components/icons/gauge-icon";
import { InfoIcon } from "@/components/icons/info-icon";
import { WarningIcon } from "@/components/icons/warning-icon";
import { UsersIcon } from "@/components/icons/users-icon";
import { StatCard } from "@/components/overview/stat-card";
import {
  describeExhaustionPolicy,
  describePackOption,
  formatPerThousand,
} from "@/components/plans/describe-pack-option";
import { NotApplicable } from "@/components/ui/not-applicable";
import { VersionSplitBar } from "@/components/plans/version-split-bar";
import type { CatalogAlert, PackComparison, PeriodPricing, PlanSummary } from "@/lib/derive/types";
import { formatMoney, formatNumber } from "@/lib/format";

type PlanPricingSummaryProps = {
  plan: PlanSummary;
  packComparison: PackComparison | null;
  /** Alerts about what happens when credits run out, shown inside that card. */
  exhaustionAlerts: CatalogAlert[];
  planNames: Map<string, string>;
  currency: string;
};

/** The same severity cues as everywhere else: icon, colour, and a label for screen readers. */
function ExhaustionNote({ alert, planNames }: { alert: CatalogAlert; planNames: Map<string, string> }) {
  const copy = describeCatalogAlert(alert, planNames);
  const isInfo = alert.severity === "info";
  return (
    <span className={`mt-1.5 flex items-start gap-1.5 text-caption ${isInfo ? "text-info" : "text-warning"}`}>
      {isInfo ? <InfoIcon className="mt-px size-3.5 shrink-0" /> : <WarningIcon className="mt-px size-3.5 shrink-0" />}
      <span>
        <span className="sr-only">{isInfo ? "Note" : "Warning"}: </span>
        {copy.note ?? copy.short}
      </span>
    </span>
  );
}

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

export function PlanPricingSummary({ plan, packComparison, exhaustionAlerts, planNames, currency }: PlanPricingSummaryProps) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<UsersIcon />}
        label="Customers"
        value={formatNumber(plan.totalSubscriptions)}
        detail={describeCustomers(plan)}
        note={<div className="mt-3"><VersionSplitBar versions={plan.versionSplit} /></div>}
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
        note={exhaustionAlerts.map((alert, index) => (
          <ExhaustionNote key={`${alert.type}-${index}`} alert={alert} planNames={planNames} />
        ))}
      />
    </dl>
  );
}
