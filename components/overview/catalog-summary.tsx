import { ArchiveIcon } from "@/components/icons/archive-icon";
import { CoinsIcon } from "@/components/icons/coins-icon";
import { UsersIcon } from "@/components/icons/users-icon";
import { CustomerDistribution } from "@/components/overview/customer-distribution";
import { StatCard } from "@/components/overview/stat-card";
import type { CatalogTotals, CustomerDistribution as Distribution } from "@/lib/derive/types";
import { formatNumber, formatPercent } from "@/lib/format";

type CatalogSummaryProps = { totals: CatalogTotals; distribution: Distribution };

const shareOf = (part: number, total: number) => formatPercent(total > 0 ? part / total : 0);

/**
 * The customer count holds its own split by plan: how many there are and where they sit are
 * one fact, and the widest card makes it the first thing read on the page.
 */
export function CatalogSummary({ totals, distribution }: CatalogSummaryProps) {
  const { largest } = distribution;

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        className="col-span-2"
        icon={<UsersIcon />}
        label="Customers"
        value={formatNumber(totals.totalCustomers)}
        detail={
          largest
            ? `${largest.percent}% on ${largest.planName}, the largest plan`
            : "No customers yet"
        }
        note={<CustomerDistribution distribution={distribution} />}
      />
      <StatCard
        icon={<CoinsIcon />}
        label="Paid customers"
        value={formatNumber(totals.paidCustomers)}
        detail={`${shareOf(totals.paidCustomers, totals.totalCustomers)} of customers`}
      />
      <StatCard
        icon={<ArchiveIcon />}
        label="On retired versions"
        value={formatNumber(totals.customersOnRetiredVersions)}
        detail={`${shareOf(totals.customersOnRetiredVersions, totals.totalCustomers)} of customers`}
      />
    </dl>
  );
}
