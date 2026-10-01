"use client";

import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Catalog } from "@/lib/catalog";
import type { PlanDetail } from "@/lib/derive/types";
import { findPlanByCode } from "@/lib/derive/plans";
import { getPlanDetail, resolveViewedVersion } from "@/lib/derive/plan-detail";
import { publishPlanEdit, type EditPublication, type EditPublicationRequest, type PublicationResult, type ScheduledMigration } from "@/lib/edit-plan/publication";
import { PlanEditorSession } from "./plan-editor-session";
import { PlanDetailReading } from "./plan-detail-reading";
import { PlanDetailHistory } from "./plan-detail-history";
import { PlanPublicationConfirmation } from "./plan-publication-confirmation";

export type PlanDetailEditorProps = { catalog: Catalog; detail: PlanDetail; viewedVersion: number; editRequested: boolean; compare?: string | string[]; diff?: string | string[]; animateEditEntry?: boolean; readOnly: ReactNode; history: ReactNode;
  schedules?: readonly ScheduledMigration[]; onPublish?: (request: EditPublicationRequest, animate?: boolean, migrationOnly?: boolean) => PublicationResult; migrationEntry?: string | null };

/** Server-rendered reading/history stay in slots; only draft controls and actions own browser state. */
export function PlanDetailEditor(props: PlanDetailEditorProps) {
  const params = useSearchParams();
  const [simulation, setSimulation] = useState<EditPublication | null>(null);
  const [confirmation, setConfirmation] = useState<{ publication: EditPublication; persistence?: "local" | "memory"; animate: boolean } | null>(null);
  const [revision, setRevision] = useState(0);
  const catalog = props.onPublish ? props.catalog : simulation?.catalog ?? props.catalog;
  const detail = getPlanDetail(catalog, props.detail.plan.code) ?? props.detail;
  const plan = findPlanByCode(catalog, detail.plan.code);
  const schedules = props.onPublish ? props.schedules ?? [] : simulation?.schedules ?? props.schedules ?? [];
  // The live URL owns mode selection during SSR, hydration and history updates.
  const editRequested = params.get("edit") === "1" || params.get("edit") === "instant";
  const viewedVersion = editRequested ? detail.plan.currentReleaseVersion : resolveViewedVersion(detail.timeline, params.get("version") ?? String(props.viewedVersion), detail.plan.currentReleaseVersion);
  const compare = params.get("compare") ?? undefined;
  const comparisonKey = Array.isArray(compare) ? compare[0] : compare;
  function publish(request: EditPublicationRequest, animate = false, migrationOnly = false): PublicationResult {
    const result = props.onPublish ? props.onPublish(request) : publishPlanEdit(catalog, schedules, request);
    if (!result.ok) return result;
    if (!props.onPublish) setSimulation(result.publication);
    setConfirmation({ publication: result.publication, persistence: result.persistence, animate });
    // Standalone moves retain unsaved controls and the current editing URL.
    if (migrationOnly) return result;
    setRevision((value) => value + 1);
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    url.searchParams.delete("migrate");
    url.searchParams.delete("compare");
    url.searchParams.delete("diff");
    url.hash = "";
    url.searchParams.set("version", String(result.publication.version));
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    return result;
  }
  if (!plan) return <>{props.readOnly}{props.history}</>;
  const updated = simulation !== null || revision > 0 || viewedVersion !== props.viewedVersion;
  return <>
    <PlanEditorSession key={`${plan.id}:${viewedVersion}:${revision}:${comparisonKey ?? ""}`} {...props} compare={compare} diff={params.get("diff") ?? undefined} animateEditEntry={params.get("edit") === "instant" ? false : props.animateEditEntry} catalog={catalog} detail={detail} viewedVersion={viewedVersion} original={plan} schedules={schedules}
      migrationEntry={params.get("migrate")}
      editRequested={editRequested} onPublish={publish}
      readOnly={updated ? <PlanDetailReading catalog={catalog} detail={detail} viewedVersion={viewedVersion} /> : props.readOnly}
      history={updated ? <PlanDetailHistory catalog={catalog} detail={detail} schedules={schedules} /> : props.history} />
    {confirmation && <PlanPublicationConfirmation {...confirmation} persisted={Boolean(props.onPublish)} onClose={() => { setConfirmation(null); requestAnimationFrame(() => (document.getElementById("customer-migration") ?? document.getElementById("edit-plan-action"))?.focus({ preventScroll: true })); }} />}
  </>;
}
