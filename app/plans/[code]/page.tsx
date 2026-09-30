import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageSection } from "@/components/page-section";
import { FeatureConfiguration } from "@/components/plan-detail/feature-configuration";
import { PlanAlerts } from "@/components/plan-detail/plan-alerts";
import { PlanHeader } from "@/components/plan-detail/plan-header";
import { PlanPricingSummary } from "@/components/plan-detail/plan-pricing-summary";
import { PricingScopeNote } from "@/components/plan-detail/pricing-scope-note";
import { VersionChanges } from "@/components/plan-detail/version-changes";
import { VersionSwitcher } from "@/components/plan-detail/version-switcher";
import { VersionTimeline } from "@/components/plan-detail/version-timeline";
import { catalog } from "@/data/catalog";
import { getFeatureRows, getPlanDetail, resolveViewedVersion } from "@/lib/derive/plan-detail";
import { getPlanNames } from "@/lib/derive/plans";

export async function generateMetadata({ params }: PageProps<"/plans/[code]">): Promise<Metadata> {
  const { code } = await params;
  const detail = getPlanDetail(catalog, code);
  return { title: `${detail?.plan.name ?? "Plan"} · ${catalog.organization.name} pricing` };
}

export default async function PlanPage({ params, searchParams }: PageProps<"/plans/[code]">) {
  const { code } = await params;
  const { version } = await searchParams;
  const detail = getPlanDetail(catalog, code);
  if (!detail) notFound();

  const { plan, timeline, alerts, packComparison } = detail;
  const currency = catalog.organization.currency;
  const viewedVersion = resolveViewedVersion(timeline, version, plan.currentReleaseVersion);
  const viewed = timeline.find((entry) => entry.version === viewedVersion);
  const current = timeline.find((entry) => entry.isCurrent);

  return (
    <>
      <PlanHeader name={plan.name} isPublic={plan.isPublic} />
      <PlanAlerts alerts={alerts} planName={plan.name} planNames={getPlanNames(catalog)} />

      <PageSection id="pricing" title="Pricing" description={<PricingScopeNote totalCustomers={plan.totalSubscriptions} />}>
        <PlanPricingSummary plan={plan} packComparison={packComparison} currency={currency} />
      </PageSection>

      <PageSection id="versions" title="Versions">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <VersionTimeline timeline={timeline} />
          <VersionChanges timeline={timeline} currency={currency} />
        </div>
      </PageSection>

      <PageSection
        id="features"
        title="Features"
        actions={<VersionSwitcher planCode={plan.code} timeline={timeline} viewedVersion={viewedVersion} />}
      >
        {viewed ? (
          <FeatureConfiguration
            viewed={viewed}
            currentVersion={plan.currentReleaseVersion}
            rows={getFeatureRows(viewed, current)}
            currency={currency}
          />
        ) : (
          <p className="text-ink-muted">This plan has no versions to show.</p>
        )}
      </PageSection>
    </>
  );
}
