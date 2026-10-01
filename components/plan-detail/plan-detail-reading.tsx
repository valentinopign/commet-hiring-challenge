import type { Catalog } from "@/lib/catalog";
import type { PlanDetail } from "@/lib/derive/types";
import { getFeatureRows } from "@/lib/derive/plan-detail";
import { getPlanNames } from "@/lib/derive/plans";
import { PageSection } from "@/components/page-section";
import { getAlertSection } from "./alert-placement";
import { PlanPricingSummary } from "./plan-pricing-summary";
import { PricingScopeNote } from "./pricing-scope-note";
import { VersionSwitcher } from "./version-switcher";
import { FeatureConfiguration } from "./feature-configuration";

export function PlanDetailReading({ catalog, detail, viewedVersion }: { catalog: Catalog; detail: PlanDetail; viewedVersion: number }) {
  const { plan, timeline, alerts, packComparison } = detail;
  const viewed = timeline.find((entry) => entry.version === viewedVersion);
  const current = timeline.find((entry) => entry.isCurrent);
  return <>
    <section id="pricing" aria-labelledby="pricing-heading" className="mt-4">
      <h2 id="pricing-heading" className="sr-only">Pricing</h2>
      <div className="sr-only"><PricingScopeNote totalCustomers={plan.totalSubscriptions} /></div>
      <PlanPricingSummary plan={plan} packComparison={packComparison} exhaustionAlerts={alerts.filter((alert) => getAlertSection(alert) === "pricing")} planNames={getPlanNames(catalog)} currency={catalog.organization.currency} />
    </section>
    <PageSection id="features" title="Features">
      <VersionSwitcher planCode={plan.code} timeline={timeline} viewedVersion={viewedVersion} />
      {viewed ? <FeatureConfiguration viewed={viewed} currentVersion={plan.currentReleaseVersion} rows={getFeatureRows(viewed, current)} currency={catalog.organization.currency} /> : <p className="text-ink-muted">This plan has no versions to show.</p>}
    </PageSection>
  </>;
}
