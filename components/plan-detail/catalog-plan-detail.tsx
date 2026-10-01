import type { Catalog } from "@/lib/catalog";
import type { PlanDetail } from "@/lib/derive/types";
import { resolveViewedVersion } from "@/lib/derive/plan-detail";
import type { EditPublicationRequest, PublicationResult, ScheduledMigration } from "@/lib/edit-plan/publication";
import { PlanDetailEditor } from "./plan-detail-editor";
import { PlanDetailReading } from "./plan-detail-reading";
import { PlanDetailHistory } from "./plan-detail-history";

export function CatalogPlanDetail({ catalog, detail, version, editRequested = false, animateEditEntry = true, schedules = [], onPublish }: {
  catalog: Catalog; detail: PlanDetail; version: string | string[] | undefined;
  editRequested?: boolean; animateEditEntry?: boolean; schedules?: readonly ScheduledMigration[];
  onPublish?: (request: EditPublicationRequest) => PublicationResult;
}) {
  const viewedVersion = resolveViewedVersion(detail.timeline, version, detail.plan.currentReleaseVersion);
  return <PlanDetailEditor catalog={catalog} detail={detail} viewedVersion={viewedVersion} editRequested={editRequested} animateEditEntry={animateEditEntry} schedules={schedules} onPublish={onPublish}
    readOnly={<PlanDetailReading catalog={catalog} detail={detail} viewedVersion={viewedVersion} />}
    history={<PlanDetailHistory catalog={catalog} detail={detail} schedules={schedules} />} />;
}
