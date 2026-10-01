import type { Catalog } from "@/lib/catalog";
import { PageSection } from "@/components/page-section";
import { getAlertSection } from "@/components/plan-detail/alert-placement";
import { FeatureConfiguration } from "@/components/plan-detail/feature-configuration";
import { PlanAlerts } from "@/components/plan-detail/plan-alerts";
import { PlanHeader } from "@/components/plan-detail/plan-header";
import { PlanPricingSummary } from "@/components/plan-detail/plan-pricing-summary";
import { PricingScopeNote } from "@/components/plan-detail/pricing-scope-note";
import { VersionChanges } from "@/components/plan-detail/version-changes";
import { VersionSwitcher } from "@/components/plan-detail/version-switcher";
import { VersionTimeline } from "@/components/plan-detail/version-timeline";
import { getFeatureRows, resolveViewedVersion } from "@/lib/derive/plan-detail";
import type { PlanDetail } from "@/lib/derive/types";
import { getPlanNames } from "@/lib/derive/plans";
import type { ReactNode } from "react";
import { getComparisonOptions, resolveComparisonTarget } from "@/lib/derive/compare-plans";
import { ComparePlanSelector } from "@/components/plan-detail/compare-plan-selector";
import { PlanComparison } from "@/components/plan-detail/plan-comparison";

export function CatalogPlanDetail({ catalog, detail, version, compare, diff, editRequested = false, actions }: {
  catalog: Catalog;
  detail: PlanDetail;
  version: string | string[] | undefined;
  compare?: string | string[];
  diff?: string | string[];
  editRequested?: boolean;
  actions?: ReactNode;
}) {
  const { plan, timeline, alerts, packComparison } = detail;
  const currency = catalog.organization.currency;
  const viewedVersion = resolveViewedVersion(timeline, version, plan.currentReleaseVersion);
  const viewed = timeline.find((entry) => entry.version === viewedVersion);
  const current = timeline.find((entry) => entry.isCurrent);
  const planNames = getPlanNames(catalog);
  const target = resolveComparisonTarget(catalog, plan.code, compare, editRequested);
  if (target && viewed) return <PlanComparison catalog={catalog} detail={detail} viewed={viewed} target={target} onlyDifferences={(Array.isArray(diff) ? diff[0] : diff) === "1"} actions={actions} />;
  return <>
    <PlanHeader code={plan.code} name={plan.name} isPublic={plan.isPublic} beforeActions={<ComparePlanSelector planCode={plan.code} viewedVersion={viewedVersion} options={getComparisonOptions(catalog, plan.code, viewedVersion)} />} actions={actions} />
    {compare && !editRequested && <p role="status" className="mt-3 text-caption text-warning">Comparison unavailable. Choose another plan or version with Compare.</p>}
    <section id="pricing" aria-labelledby="pricing-heading" className="mt-4">
      <h2 id="pricing-heading" className="sr-only">Pricing</h2>
      <div className="sr-only"><PricingScopeNote totalCustomers={plan.totalSubscriptions} /></div>
      <PlanPricingSummary plan={plan} packComparison={packComparison} exhaustionAlerts={alerts.filter((alert) => getAlertSection(alert) === "pricing")} planNames={planNames} currency={currency} />
    </section>
    <PageSection id="features" title="Features">
      <VersionSwitcher planCode={plan.code} timeline={timeline} viewedVersion={viewedVersion} />
      {viewed ? <FeatureConfiguration viewed={viewed} currentVersion={plan.currentReleaseVersion} rows={getFeatureRows(viewed, current)} currency={currency} /> : <p className="text-ink-muted">This plan has no versions to show.</p>}
    </PageSection>
    <PageSection id="versions" title="Versions">
      <PlanAlerts alerts={alerts.filter((alert) => getAlertSection(alert) === "versions")} planName={plan.name} planNames={planNames} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"><VersionTimeline timeline={timeline} /><VersionChanges timeline={timeline} currency={currency} /></div>
    </PageSection>
  </>;
}
