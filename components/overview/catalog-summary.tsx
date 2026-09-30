import { ArchiveIcon } from "@/components/icons/archive-icon";
import { LayersIcon } from "@/components/icons/layers-icon";
import { UsersIcon } from "@/components/icons/users-icon";
import { StatCard } from "@/components/overview/stat-card";
import type { CatalogTotals } from "@/lib/derive/types";
import { formatNumber, formatPercent } from "@/lib/format";

type CatalogSummaryProps = { totals: CatalogTotals };

export function CatalogSummary({ totals }: CatalogSummaryProps) {
  const retiredShare =
    totals.totalCustomers > 0 ? totals.customersOnRetiredVersions / totals.totalCustomers : 0;
  const privatePlanCount = totals.planCount - totals.publicPlanCount;

  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard
        icon={<UsersIcon />}
        label="Customers"
        value={formatNumber(totals.totalCustomers)}
        detail="Across every plan and version"
      />
      <StatCard
        icon={<ArchiveIcon />}
        label="On retired versions"
        value={formatNumber(totals.customersOnRetiredVersions)}
        detail={`${formatPercent(retiredShare)} of customers`}
      />
      <StatCard
        icon={<LayersIcon />}
        label="Plans"
        value={formatNumber(totals.planCount)}
        detail={`${totals.publicPlanCount} public, ${privatePlanCount} private`}
      />
    </dl>
  );
}
