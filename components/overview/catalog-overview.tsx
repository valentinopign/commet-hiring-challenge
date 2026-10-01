import type { Catalog } from "@/lib/catalog";
import { CatalogSummary } from "@/components/overview/catalog-summary";
import { PageHeading } from "@/components/page-heading";
import { PageSection } from "@/components/page-section";
import { CreatePlanLink } from "@/components/plans/create-plan-link";
import { PlanCardGrid } from "@/components/plans/plan-card-grid";
import { getCatalogAlerts, needsAttention } from "@/lib/derive/alerts";
import { getCustomerDistribution } from "@/lib/derive/customer-distribution";
import { getLadderRows } from "@/lib/derive/ladder";
import { getPlanNames } from "@/lib/derive/plans";
import { getCatalogTotals } from "@/lib/derive/subscriptions";

/** Shared markup: Nimbus renders this on the server, local companies after hydration. */
export function CatalogOverview({ catalog }: { catalog: Catalog }) {
  const alerts = getCatalogAlerts(catalog);
  const planNames = getPlanNames(catalog);
  return <>
    <PageHeading title="Overview" />
    <div className="mt-4"><CatalogSummary totals={getCatalogTotals(catalog)} distribution={getCustomerDistribution(catalog)} /></div>
    <PageSection id="plans" title="Plans" description="Cheapest first, monthly billing. Price, credits and policy reach every customer on every version." actions={<CreatePlanLink />}>
      <PlanCardGrid rows={getLadderRows(catalog)} alerts={alerts.filter(needsAttention)} planNames={planNames} currency={catalog.organization.currency} />
    </PageSection>
  </>;
}
