import type { Catalog } from "@/lib/catalog";
import type { PlanDetail } from "@/lib/derive/types";
import type { ScheduledMigration } from "@/lib/edit-plan/publication";
import { getPlanNames } from "@/lib/derive/plans";
import { PageSection } from "@/components/page-section";
import { getAlertSection } from "./alert-placement";
import { PlanAlerts } from "./plan-alerts";
import { VersionTimeline } from "./version-timeline";
import { VersionChanges } from "./version-changes";

export function PlanDetailHistory({ catalog, detail, schedules = [] }: { catalog: Catalog; detail: PlanDetail; schedules?: readonly ScheduledMigration[] }) {
  const relevant = schedules.filter((item) => item.organizationId === catalog.organization.id && item.planCode === detail.plan.code);
  return <PageSection id="versions" title="Versions">
    <PlanAlerts alerts={detail.alerts.filter((alert) => getAlertSection(alert) === "versions")} planName={detail.plan.name} planNames={getPlanNames(catalog)} schedules={relevant} />
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"><VersionTimeline timeline={detail.timeline} schedules={relevant} planCode={detail.plan.code} /><VersionChanges timeline={detail.timeline} currency={catalog.organization.currency} /></div>
  </PageSection>;
}
