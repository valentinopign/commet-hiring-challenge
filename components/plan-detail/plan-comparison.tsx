import type { ReactNode } from "react";
import Link from "@/components/organizations/catalog-link";
import { CoinsIcon } from "@/components/icons/coins-icon";
import { GaugeIcon } from "@/components/icons/gauge-icon";
import { KeyIcon } from "@/components/icons/key-icon";
import { CheckIcon } from "@/components/icons/check-icon";
import { PageSection } from "@/components/page-section";
import { ComparePlanSelector } from "@/components/plan-detail/compare-plan-selector";
import { ComparisonFeatureTable } from "@/components/plan-detail/comparison-feature-table";
import { ComparisonPricing } from "@/components/plan-detail/comparison-pricing";
import { ComparisonBar } from "@/components/plan-detail/comparison-bar";
import { ComparisonMotion } from "@/components/plan-detail/comparison-motion";
import { PlanAlerts } from "@/components/plan-detail/plan-alerts";
import { PlanHeader } from "@/components/plan-detail/plan-header";
import { VersionSwitcher } from "@/components/plan-detail/version-switcher";
import { outlineControlClass } from "@/components/ui/control-styles";
import { getComparedFeatureRows, getComparisonOptions, planComparisonHref, type ComparisonTarget } from "@/lib/derive/compare-plans";
import { getPlanNames } from "@/lib/derive/plans";
import type { Catalog } from "@/lib/catalog";
import type { PlanDetail, TimelineEntry } from "@/lib/derive/types";

type Props = { catalog: Catalog; detail: PlanDetail; viewed: TimelineEntry; target: ComparisonTarget; onlyDifferences: boolean; actions?: ReactNode };

/** Comparison is a separate reading view so the ordinary detail and editor can evolve independently. */
export function PlanComparison({ catalog, detail, viewed, target, onlyDifferences, actions }: Props) {
  const leftLabel = `${detail.plan.name} · v${viewed.version}`;
  const rightLabel = `${target.detail.plan.name} · v${target.viewed.version}`;
  const options = getComparisonOptions(catalog, detail.plan.code, viewed.version);
  const rows = getComparedFeatureRows(viewed, target.viewed, onlyDifferences);
  const query = { version: viewed.version, compare: target.parameter, onlyDifferences };
  const planNames = getPlanNames(catalog);
  const currency = catalog.organization.currency;
  return <ComparisonMotion comparisonKey={target.parameter}>
    <PlanHeader code={detail.plan.code} name={detail.plan.name} isPublic={detail.plan.isPublic} beforeActions={<ComparePlanSelector planCode={detail.plan.code} viewedVersion={viewed.version} options={options} onlyDifferences={onlyDifferences} selectedCompare={target.parameter} lateralTrigger />} actions={actions} />
    <section aria-labelledby="comparison-heading" className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="comparison-heading" className="font-medium">Comparing {detail.plan.name} v{viewed.version} with {target.detail.plan.name} v{target.viewed.version}</h2>
      </div>
      <p className="sr-only">Feature impacts describe {rightLabel} relative to {leftLabel}. Pricing and customer totals belong to each plan across all versions.</p>
      {!target.detail.plan.isPublic && <p className="mt-1 text-caption text-ink-muted">{target.detail.plan.name} is a private plan.</p>}
    </section>
    <section id="pricing" aria-labelledby="pricing-heading" className="mt-4">
      <h2 id="pricing-heading" className="sr-only">Pricing comparison</h2>
      <ComparisonPricing left={detail} right={target.detail} leftLabel={leftLabel} rightLabel={rightLabel} currency={currency} planNames={planNames} />
    </section>
    <PageSection id="features" title="Features">
      <VersionSwitcher planCode={detail.plan.code} timeline={detail.timeline} viewedVersion={viewed.version} comparisonQuery={{ compare: target.parameter, onlyDifferences }} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-ink-muted">{rows.differences} of {rows.total} features differ. Equal values have no impact label.</p>
        <Link href={planComparisonHref(detail.plan.code, { ...query, onlyDifferences: !onlyDifferences })} scroll={false} className={`${outlineControlClass} min-h-11 ${onlyDifferences ? "border-live bg-live-soft" : ""}`} aria-label={`Only differences: ${onlyDifferences ? "on, show all features" : "off, hide equal features"}`}>
          <span aria-hidden="true" className="flex size-4 items-center justify-center rounded border border-line-strong">{onlyDifferences && <CheckIcon className="size-3" />}</span>Only differences
        </Link>
      </div>
      <PlanAlerts alerts={detail.alerts.filter((alert) => alert.type === "current_version_mismatch" || alert.type === "orphan_subscriptions")} planName={detail.plan.name} planNames={planNames} />
      <PlanAlerts alerts={target.detail.alerts.filter((alert) => alert.type === "current_version_mismatch" || alert.type === "orphan_subscriptions")} planName={target.detail.plan.name} planNames={planNames} />
      <div className="space-y-3">
        <ComparisonFeatureTable group="credit" icon={<CoinsIcon />} rows={rows.groups.credit} leftLabel={leftLabel} rightLabel={rightLabel} currency={currency} onlyDifferences={onlyDifferences} />
        <ComparisonFeatureTable group="capacity" icon={<GaugeIcon />} rows={rows.groups.capacity} leftLabel={leftLabel} rightLabel={rightLabel} currency={currency} onlyDifferences={onlyDifferences} />
        <ComparisonFeatureTable group="boolean" icon={<KeyIcon />} rows={rows.groups.boolean} leftLabel={leftLabel} rightLabel={rightLabel} currency={currency} onlyDifferences={onlyDifferences} />
      </div>
    </PageSection>
    <ComparisonBar leftLabel={`${detail.plan.name} v${viewed.version}`} rightLabel={`${target.detail.plan.name} v${target.viewed.version}`} differences={rows.differences} total={rows.total} exitHref={planComparisonHref(detail.plan.code, { version: viewed.version })} />
  </ComparisonMotion>;
}
