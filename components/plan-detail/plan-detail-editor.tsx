"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useReducer, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { FieldError } from "@/components/create-plan/field-error";
import { DraftWarningList } from "@/components/create-plan/draft-warning-list";
import { EditableFeatures } from "@/components/plan-detail/editable-features";
import { EditablePricing } from "@/components/plan-detail/editable-pricing";
import { EditChangeMark } from "@/components/plan-detail/edit-change-mark";
import { PlanEditBar } from "@/components/plan-detail/plan-edit-bar";
import { PlanHeader } from "@/components/plan-detail/plan-header";
import { ComparePlanSelector } from "./compare-plan-selector";
import { PlanComparison } from "./plan-comparison";
import { getComparisonOptions, resolveComparisonTarget } from "@/lib/derive/compare-plans";
import { planEditHref } from "@/lib/edit-plan/navigation";
import { inputClass, outlineControlClass, primaryControlClass } from "@/components/ui/control-styles";
import type { Catalog, Plan } from "@/lib/catalog";
import { createEditState, deriveEditChecks, derivePlanChanges, editPlanReducer, validatePlanEdit } from "@/lib/edit-plan/changes";
import { findPlanByCode, getPlanNames } from "@/lib/derive/plans";
import { getCurrentRelease } from "@/lib/derive/releases";
import { deriveEditPricingContext } from "@/lib/edit-plan/pricing-context";
import type { PlanDetail } from "@/lib/derive/types";
import { getPlanDetail, resolveViewedVersion } from "@/lib/derive/plan-detail";
import { deriveMigrationSelection, publishPlanEdit, type EditPublication, type EditPublicationRequest, type PublicationResult, type ScheduledMigration } from "@/lib/edit-plan/publication";
import { MigrationVersionSelector } from "./migration-version-selector";
import { MigrationDestinationSelect } from "./migration-destination-select";
import { PlanDetailReading } from "./plan-detail-reading";
import { PlanDetailHistory } from "./plan-detail-history";
import { PlanEditReview } from "./plan-edit-review";
import { PlanPublicationConfirmation } from "./plan-publication-confirmation";
import { ReviewDialog } from "./review-dialog";
import { formatNumber } from "@/lib/format";

type Props = { catalog: Catalog; detail: PlanDetail; viewedVersion: number; editRequested: boolean; compare?: string | string[]; diff?: string | string[]; animateEditEntry?: boolean; readOnly: ReactNode; history: ReactNode;
  schedules?: readonly ScheduledMigration[]; onPublish?: (request: EditPublicationRequest, animate?: boolean, migrationOnly?: boolean) => PublicationResult; migrationEntry?: string | null };

/** Server-rendered reading/history stay in slots; only draft controls and actions own browser state. */
export function PlanDetailEditor(props: Props) {
  const params = useSearchParams();
  const [simulation, setSimulation] = useState<EditPublication | null>(null);
  const [confirmation, setConfirmation] = useState<{ publication: EditPublication; persistence?: "local" | "memory"; animate: boolean } | null>(null);
  const [revision, setRevision] = useState(0);
  const catalog = props.onPublish ? props.catalog : simulation?.catalog ?? props.catalog;
  const detail = getPlanDetail(catalog, props.detail.plan.code) ?? props.detail;
  const plan = findPlanByCode(catalog, detail.plan.code);
  const schedules = props.onPublish ? props.schedules ?? [] : simulation?.schedules ?? props.schedules ?? [];
  // Server slots use route props; in the browser the live URL also reflects history.replaceState.
  const routeFallback = typeof window === "undefined";
  const editRequested = params.get("edit") === "1" || params.get("edit") === "instant" || (routeFallback && revision === 0 && props.editRequested);
  const viewedVersion = editRequested ? detail.plan.currentReleaseVersion : resolveViewedVersion(detail.timeline, params.get("version") ?? String(props.viewedVersion), detail.plan.currentReleaseVersion);
  const compare = params.get("compare") ?? (routeFallback ? props.compare : undefined);
  const comparisonKey = Array.isArray(compare) ? compare[0] : compare;
  function publish(request: EditPublicationRequest, animate = false, migrationOnly = false): PublicationResult {
    const result = props.onPublish ? props.onPublish(request) : publishPlanEdit(catalog, schedules, request);
    if (!result.ok) return result;
    if (!props.onPublish) setSimulation(result.publication);
    setConfirmation({ publication: result.publication, persistence: result.persistence, animate });
    // A standalone move must preserve unsaved plan controls and keep the editing URL.
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
    <PlanEditorSession key={`${plan.id}:${viewedVersion}:${revision}:${comparisonKey ?? ""}`} {...props} compare={compare} diff={params.get("diff") ?? (routeFallback ? props.diff : undefined)} animateEditEntry={params.get("edit") === "instant" ? false : props.animateEditEntry} catalog={catalog} detail={detail} viewedVersion={viewedVersion} original={plan} schedules={schedules}
      migrationEntry={params.get("migrate")}
      editRequested={editRequested} onPublish={publish}
      readOnly={updated ? <PlanDetailReading catalog={catalog} detail={detail} viewedVersion={viewedVersion} /> : props.readOnly}
      history={updated ? <PlanDetailHistory catalog={catalog} detail={detail} schedules={schedules} /> : props.history} />
    {confirmation && <PlanPublicationConfirmation {...confirmation} persisted={Boolean(props.onPublish)} onClose={() => { setConfirmation(null); requestAnimationFrame(() => (document.getElementById("customer-migration") ?? document.getElementById("edit-plan-action"))?.focus({ preventScroll: true })); }} />}
  </>;
}

function PlanEditorSession({ catalog, detail, original, viewedVersion, compare, diff, editRequested, animateEditEntry = true, readOnly, history, schedules = [], onPublish, migrationEntry }: Props & { original: Plan }) {
  const router = useRouter();
  const [editing, setEditing] = useState(editRequested && viewedVersion === original.currentReleaseVersion);
  const [animateEntry, setAnimateEntry] = useState(animateEditEntry);
  const [state, dispatch] = useReducer(editPlanReducer, original, (plan) => createEditState(catalog, plan));
  const [barHeight, setBarHeight] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [animateDialog, setAnimateDialog] = useState(false);
  const [animateRead, setAnimateRead] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<number[]>(() => migrationEntry && /^\d+$/.test(migrationEntry) ? [Number(migrationEntry)] : []);
  const [targetVersion, setTargetVersion] = useState(original.currentReleaseVersion);
  const [migrationNotice, setMigrationNotice] = useState("");
  const [migrationOpen, setMigrationOpen] = useState(Boolean(migrationEntry && editRequested));
  const [migrationConfirm, setMigrationConfirm] = useState(false);
  const migrationPublishing = useRef(false);
  const migrationButton = useRef<HTMLButtonElement>(null);
  const migrationConfirmation = useRef<HTMLParagraphElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const canEdit = getCurrentRelease(original)?.status === "published";
  const changes = derivePlanChanges(catalog, original, state.draft, state.pending);
  const migration = deriveMigrationSelection(catalog, original, state, schedules, targetVersion, selectedVersions, "immediate");
  const validSelectionKey = JSON.stringify(migration.selectedVersions);
  const selectionKey = JSON.stringify(selectedVersions);
  const issues = validatePlanEdit(state);
  const nameError = issues.find((issue) => issue.field === "plan-name")?.message;
  const { comparisons, warnings } = deriveEditChecks(catalog, original, state);
  const pricingContext = deriveEditPricingContext(catalog, original, state);
  const currency = catalog.organization.currency;
  const target = resolveComparisonTarget(catalog, original.code, compare, editing || editRequested);
  const viewed = detail.timeline.find((entry) => entry.version === viewedVersion);

  useEffect(() => {
    if (editing && !migrationEntry) nameInput.current?.focus({ preventScroll: true });
  }, [editing, migrationEntry]);

  useEffect(() => {
    if (migrationConfirm) migrationConfirmation.current?.focus({ preventScroll: true });
  }, [migrationConfirm]);

  useEffect(() => {
    if (!editRequested || !migrationEntry || viewedVersion !== original.currentReleaseVersion) return;
    setEditing(true);
    setMigrationOpen(true);
    setSelectedVersions(/^\d+$/.test(migrationEntry) ? [Number(migrationEntry)] : []);
  }, [editRequested, migrationEntry, viewedVersion, original.currentReleaseVersion]);

  useEffect(() => {
    const valid: number[] = JSON.parse(validSelectionKey);
    const selected: number[] = JSON.parse(selectionKey);
    if (selected.some((version) => !valid.includes(version))) {
      setSelectedVersions(valid);
      setMigrationNotice("Some sources were deselected because they no longer have customers or cannot move forward to this destination.");
    }
  }, [validSelectionKey, selectionKey]);

  useEffect(() => {
    if (!editing) return;
    const root = document.documentElement;
    const previous = root.style.scrollPaddingBottom;
    root.style.scrollPaddingBottom = `${barHeight + 16}px`;
    return () => { root.style.scrollPaddingBottom = previous; };
  }, [editing, barHeight]);

  function beginEditing(event: MouseEvent<HTMLButtonElement>) {
    // Keyboard activation stays instant; pointer entry briefly bridges the mode change.
    const animate = event.detail > 0;
    setAnimateEntry(animate);
    const href = planEditHref(window.location.href, original.currentReleaseVersion, animate);
    if (viewedVersion !== original.currentReleaseVersion) {
      router.push(href, { scroll: false });
      return;
    }
    setEditing(true);
    window.history.replaceState(null, "", href);
  }

  function discard(event: MouseEvent<HTMLButtonElement>) {
    // Remount controls from a fresh snapshot; unfinished input text must disappear as well.
    setAnimateRead(event.detail > 0);
    setAnimateEntry(event.detail > 0);
    setEditing(false);
    setMigrationOpen(false);
    setMigrationConfirm(false);
    dispatch({ type: "discard", state: createEditState(catalog, original) });
    setSelectedVersions([]);
    setTargetVersion(original.currentReleaseVersion);
    setMigrationNotice("");
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    url.searchParams.delete("migrate");
    url.searchParams.delete("compare");
    url.searchParams.delete("diff");
    url.hash = "";
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    requestAnimationFrame(() => editButton.current?.focus({ preventScroll: true }));
  }

  function confirmMigration(event: MouseEvent<HTMLButtonElement>) {
    if (!onPublish || migrationPublishing.current) return;
    migrationPublishing.current = true;
    const result = onPublish({ original, state: createEditState(catalog, original), selectedVersions: migration.selectedVersions,
      targetVersion: migration.targetVersion, scheduledAt: new Date().toISOString(), migrationTiming: "immediate",
      expectedMigrationCustomers: migration.customers }, event.detail > 0, true);
    if (!result.ok) {
      migrationPublishing.current = false;
      setMigrationNotice("Could not move these customers. Their plan or counts may have changed. Close this panel and review the latest versions.");
      return;
    }
    setMigrationOpen(false);
    setMigrationConfirm(false);
    setSelectedVersions([]);
    setMigrationNotice("");
    migrationPublishing.current = false;
  }

  const identityMark = (field: "name" | "visibility") => {
    const change = changes.planChanges.find((entry) => entry.field === field);
    if (!change) return null;
    const describe = (value: typeof change.before) => typeof value === "boolean" ? value ? "Public" : "Private" : String(value);
    return <EditChangeMark before={describe(change.before)} after={describe(change.after)} impact={null} />;
  };

  const editAction = <button id="edit-plan-action" ref={editButton} type="button" disabled={!canEdit} onClick={beginEditing} className={`${primaryControlClass} min-h-11 disabled:opacity-40`}>Edit plan</button>;

  return <div data-edit-animate={animateEntry} style={editing ? { paddingBottom: barHeight + 24 } : undefined}>
    {!editing && target && viewed ? <PlanComparison catalog={catalog} detail={detail} viewed={viewed} target={target} onlyDifferences={(Array.isArray(diff) ? diff[0] : diff) === "1"} actions={editAction} /> : <>
    {!editing ? <div className={animateRead ? "plan-read-enter" : undefined}>
      <PlanHeader code={original.code} name={original.name} isPublic={original.isPublic} beforeActions={<ComparePlanSelector planCode={original.code} viewedVersion={viewedVersion} options={getComparisonOptions(catalog, original.code, viewedVersion)} />} actions={editAction} />
      {compare && !editRequested && <p role="status" className="mt-3 text-caption text-warning">Comparison unavailable. Choose another plan or version with Compare.</p>}
      {!canEdit && <p className="mt-2 text-caption text-critical">Editing requires a published current version.</p>}
      {readOnly}
    </div> : <>
      <h1 className="sr-only">Edit {original.name}</h1>
      <div className="plan-edit-enter">
      <p className="mb-3 text-caption font-medium">Editing current v{original.currentReleaseVersion} · changes are not saved yet</p>
      <div className="grid items-start gap-4 rounded-card border border-line bg-surface-card p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div>
          <label htmlFor="plan-name" className="mb-1 block text-caption">Plan name</label>
          <input ref={nameInput} id="plan-name" className={inputClass} value={state.draft.name} onChange={(event) => dispatch({ type: "set_name", name: event.target.value })} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "plan-name-error" : "plan-name-scope"} />
          <p id="plan-name-scope" className="mt-1 text-caption text-ink-muted">Renames the plan across all versions; creates no version.</p>
          {nameError && <FieldError id="plan-name-error" message={nameError} />}
          {identityMark("name")}
        </div>
        <div>
          <label htmlFor="plan-visibility" className="mb-1 block text-caption">Visibility</label>
          <select id="plan-visibility" className={`${inputClass} min-h-11`} value={state.draft.isPublic ? "public" : "private"} onChange={(event) => dispatch({ type: "set_visibility", isPublic: event.target.value === "public" })} aria-describedby="plan-visibility-scope"><option value="public">Public</option><option value="private">Private</option></select>
          <p id="plan-visibility-scope" className="mt-1 max-w-52 text-caption text-ink-muted">Changes how it is offered; existing customers stay subscribed.</p>
          {identityMark("visibility")}
        </div>
        <div><p className="text-caption text-ink-muted">API code · locked</p><p className="mt-2 font-mono text-sm">{original.code}</p></div>
      </div>
      </div>
      <div className="plan-edit-enter plan-edit-enter-pricing">
        <EditablePricing state={state} dispatch={dispatch} changes={changes} plan={detail.plan} currency={currency} issues={issues} pricingContext={pricingContext} migration={migration} />
      </div>
      <div className="plan-edit-enter plan-edit-enter-features">
        <EditableFeatures features={catalog.features} state={state} dispatch={dispatch} changes={changes} comparisons={comparisons} currency={currency} currentVersion={original.currentReleaseVersion} issues={issues} />
      </div>
      {warnings.length > 0 && <section aria-labelledby="edit-checks-heading" className="mt-5 space-y-3">
        <h2 id="edit-checks-heading" className="font-medium">Checks against other plans</h2>
        <DraftWarningList warnings={warnings} planNames={getPlanNames(catalog)} currency={currency} label="Plan checks" />
      </section>}
      <PlanEditBar changes={changes} migrationCount={migration.operationCount} migrationCustomers={migration.customers} targetVersion={migration.targetVersion} migrationAction={migration.options.length > 0 ? <button id="customer-migration" ref={migrationButton} type="button" className={`${outlineControlClass} min-h-11`} onClick={(event) => { setAnimateDialog(event.detail > 0); setMigrationConfirm(false); setMigrationOpen(true); }}>Configure migration</button> : undefined} onDiscard={discard} onReview={(event) => { setAnimateDialog(event.detail > 0); setReviewOpen(true); }} invalid={issues.length > 0 || !migration.validTarget || warnings.some((warning) => warning.severity === "blocking")} onHeightChange={setBarHeight} />
      {reviewOpen && onPublish && <PlanEditReview catalog={catalog} plan={original} state={state} changes={changes} schedules={schedules} animateDialog={animateDialog} selectedVersions={migration.selectedVersions} targetVersion={migration.targetVersion} onSelectionChange={setSelectedVersions} onClose={() => setReviewOpen(false)} onPublish={onPublish} />}
    </>}
    {history}
    </>}
    {editing && migrationOpen && migration.options.length > 0 && <ReviewDialog open animate={animateDialog} title={migrationConfirm ? "Confirm customer migration" : "Customer migration"} onClose={() => { setMigrationOpen(false); setMigrationConfirm(false); requestAnimationFrame(() => migrationButton.current?.focus({ preventScroll: true })); }}>
      {migrationConfirm ? <>
        <p ref={migrationConfirmation} tabIndex={-1} className="font-medium outline-none">You’re about to move {formatNumber(migration.customers)} customers from {migration.selectedVersions.map((version) => `v${version}`).join(" and ")} to v{migration.targetVersion}.</p>
        <p className="text-caption text-ink-muted">This applies immediately and saves the updated customer counts in this browser. Only the migration is applied; other unsaved plan changes stay in your draft.</p>
        {migrationNotice && <p role="alert" className="text-caption text-critical">{migrationNotice}</p>}
        <div className="flex gap-3"><button type="button" className={`${outlineControlClass} min-h-11`} onClick={() => { setMigrationConfirm(false); setMigrationNotice(""); }}>Back</button><button type="button" className={`${primaryControlClass} min-h-11`} onClick={confirmMigration}>Confirm & move customers</button></div>
      </> : <>
        {changes.createsVersion ? <p className="text-caption text-ink-muted">Destination: v{migration.targetVersion}, the new feature version.</p> : <MigrationDestinationSelect destinations={migration.destinations} currentVersion={original.currentReleaseVersion} value={migration.targetVersion} onChange={setTargetVersion} />}
        {migrationNotice && <p role="status" className="text-caption text-warning">{migrationNotice}</p>}
        <MigrationVersionSelector catalog={catalog} plan={original} targetVersion={migration.targetVersion} targetFeatures={migration.targetFeatures} schedules={schedules} selectedVersions={migration.selectedVersions} onChange={(versions) => { setSelectedVersions([...versions].sort((a, b) => a - b)); setMigrationNotice(""); }} />
      <div className="border-t border-line pt-4">
        <p className="text-caption text-ink-muted">{migration.operationCount > 0 ? `${formatNumber(migration.customers)} customers selected · v${migration.targetVersion}.` : "No customers selected."} {changes.createsVersion ? "The new version and selected moves are applied together in Review & publish." : "Done opens a confirmation before moving any customers."}</p>
        {changes.createsVersion || migration.operationCount === 0 ? <button type="button" data-dialog-close className={`${primaryControlClass} mt-3 min-h-11`}>Done</button> : <button type="button" className={`${primaryControlClass} mt-3 min-h-11`} onClick={() => setMigrationConfirm(true)}>Done</button>}
      </div>
      </>}
    </ReviewDialog>}
  </div>;
}
