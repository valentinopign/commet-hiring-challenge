import type { CatalogTotals } from "@/lib/derive/types";
import { formatNumber, formatPercent } from "@/lib/format";

type CatalogSummaryProps = { totals: CatalogTotals };

export function CatalogSummary({ totals }: CatalogSummaryProps) {
  const retiredShare =
    totals.totalCustomers > 0 ? totals.customersOnRetiredVersions / totals.totalCustomers : 0;
  const privatePlanCount = totals.planCount - totals.publicPlanCount;

  const items = [
    { label: "Customers", value: formatNumber(totals.totalCustomers), detail: "Across every plan and version" },
    {
      label: "On retired versions",
      value: formatNumber(totals.customersOnRetiredVersions),
      detail: `${formatPercent(retiredShare)} of customers`,
    },
    {
      label: "Plans",
      value: formatNumber(totals.planCount),
      detail: `${totals.publicPlanCount} public, ${privatePlanCount} private`,
    },
  ];

  return (
    <dl className="grid grid-cols-1 divide-y divide-line rounded-md border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-2.5">
          <dt className="text-caption text-ink-muted">{item.label}</dt>
          <dd className="text-xl leading-tight font-semibold tabular-nums">{item.value}</dd>
          <dd className="text-caption text-ink-muted">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
