"use client";

import { useRef, useState, type MouseEvent } from "react";
import type { Catalog, Plan } from "@/lib/catalog";
import type { DraftFlowState } from "@/lib/create-plan/draft-reducer";
import { deriveEditChecks, type PlanChange, type PlanChanges } from "@/lib/edit-plan/changes";
import { DraftWarningList } from "@/components/create-plan/draft-warning-list";
import { getPlanNames } from "@/lib/derive/plans";
import { describePublication, deriveMigrationSelection, getSchedulesRetiredByPublication, type EditPublicationRequest, type PublicationResult, type ScheduledMigration } from "@/lib/edit-plan/publication";
import { formatMoney, formatCount, formatNumber } from "@/lib/format";
import { primaryControlClass } from "@/components/ui/control-styles";
import { EditChangeMark } from "./edit-change-mark";
import { FeatureChangeRow } from "./feature-change-row";
import { MigrationVersionSelector } from "./migration-version-selector";
import { ReviewDialog } from "./review-dialog";

const labels: Record<PlanChange["field"], string> = { name: "Plan name", visibility: "Visibility", monthly_price: "Monthly price", monthly_credits: "Monthly included credits", yearly_price: "Yearly price", yearly_credits: "Yearly included credits", exhaustion_policy: "When credits run out", overage_price: "Price per 1,000 extra credits" };

export function PlanEditReview({ catalog, plan, state, changes, schedules, selectedVersions = [], targetVersion = plan.currentReleaseVersion, onSelectionChange, onClose, onPublish, animateDialog = true }: {
  catalog: Catalog; plan: Plan; state: DraftFlowState; changes: PlanChanges; schedules: readonly ScheduledMigration[];
  selectedVersions?: number[]; targetVersion?: number; onSelectionChange?: (versions: number[]) => void;
  animateDialog?: boolean;
  onClose: () => void; onPublish: (request: EditPublicationRequest, animate?: boolean) => PublicationResult;
}) {
  const [error, setError] = useState("");
  const publishing = useRef(false);
  const migration = deriveMigrationSelection(catalog, plan, state, schedules, targetVersion, selectedVersions, "immediate");
  const { warnings } = deriveEditChecks(catalog, plan, state);
  const movedCustomers = migration.customers;
  const retiredTargets = getSchedulesRetiredByPublication(catalog, plan, schedules, changes.createsVersion)
    .filter((item) => !migration.selectedVersions.includes(item.fromVersion));
  const retiredCustomers = retiredTargets.reduce((total, item) => total + item.customers, 0);
  const changeCount = changes.changeCount + migration.operationCount;
  const summary = describePublication({ createsVersion: changes.createsVersion, name: state.draft.name.trim(), version: changes.nextVersion, movedCustomers, fromVersions: migration.selectedVersions, migrationTargetVersion: migration.targetVersion, migrationTiming: "immediate" });
  const describeValue = (change: PlanChange, value: PlanChange["before"]): string => {
    if (typeof value === "boolean") return value ? "Public" : "Private";
    if (typeof value === "number") return change.field.endsWith("credits") ? `${formatNumber(value)} credits` : formatMoney(value, catalog.organization.currency);
    if (typeof value === "object") return value.type === "block" ? "Stop the service" : `Bill ${formatMoney(value.pricePer1000Credits, catalog.organization.currency)} / 1,000 extra credits`;
    return value;
  };
  const rows = (entries: PlanChange[]) => <ul className="divide-y divide-line">{entries.map((change) => <li key={change.field} className="py-3"><p className="text-caption font-medium">{labels[change.field]}</p><EditChangeMark before={describeValue(change, change.before)} after={describeValue(change, change.after)} impact={change.impact} /></li>)}</ul>;
  function publish(event: MouseEvent<HTMLButtonElement>) {
    if (publishing.current) return;
    publishing.current = true;
    const result = onPublish({ original: plan, state, selectedVersions: migration.selectedVersions, targetVersion: migration.targetVersion, scheduledAt: new Date().toISOString(), migrationTiming: "immediate", expectedMigrationCustomers: migration.customers }, event.detail > 0);
    if (!result.ok) {
      publishing.current = false;
      setError(result.reason === "stale-plan" ? "This plan changed while you were editing. Close Review, discard and reopen the latest plan." : "Could not publish these changes. Check the configuration and selected versions, then try again.");
    }
  }
  return <ReviewDialog open title="Review & publish" onClose={onClose} animate={animateDialog}>
    <p className="text-caption text-ink-muted">{formatCount(changeCount, "effective change")} against current v{plan.currentReleaseVersion}{migration.operationCount > 0 ? `, including ${formatCount(migration.operationCount, "selected migration source")}` : ""}.</p>
    <section className="rounded-card border border-line p-4">
      <h3 className="font-semibold">Feature version · new customers</h3>
      <p className="mt-1 text-caption text-ink-muted">{changes.createsVersion ? `Publishes ${state.draft.name.trim()} v${changes.nextVersion}. Existing customers keep their version unless selected below.` : "No feature changes. No new version."}</p>
      <ul className="mt-2 divide-y divide-line">{changes.featureChanges.map((change) => <FeatureChangeRow key={change.feature.code} change={change} currency={catalog.organization.currency} />)}</ul>
    </section>
    <section className="rounded-card border border-line p-4">
      <h3 className="font-semibold">Plan properties · all existing customers</h3>
      <p className="mt-1 text-caption text-ink-muted">{changes.affectsAllCustomers ? `Applies to all ${formatCount(changes.affectedCustomers, "customer")} across all versions at their next renewal.` : "Price, credits and exhaustion policy stay unchanged."}</p>
      {rows(changes.renewalChanges)}
    </section>
    {changes.planChanges.some((change) => change.scope === "identity") && <section><h3 className="font-semibold">Plan identity · all versions</h3><p className="mt-1 text-caption text-ink-muted">Name and visibility update the plan listing; subscriptions stay active. No new version.</p>{rows(changes.planChanges.filter((change) => change.scope === "identity"))}</section>}
    {retiredTargets.length > 0 && <p role="note" className="rounded-control border border-warning/40 bg-warning-soft p-3 text-caption">
      <span className="font-medium text-warning">Earlier moves will land on a retired version. </span>
      {formatCount(retiredCustomers, "customer")} from {retiredTargets.map((item) => `v${item.fromVersion}`).join(", ")} {retiredCustomers === 1 ? "is" : "are"} scheduled to move to v{plan.currentReleaseVersion}, which becomes retired when v{changes.nextVersion} is published. Those moves stay as scheduled unless you select their source below to replace them with an immediate move.
    </p>}
    {migration.options.length > 0 && <MigrationVersionSelector catalog={catalog} plan={plan} targetVersion={migration.targetVersion} targetFeatures={migration.targetFeatures} schedules={schedules} selectedVersions={migration.selectedVersions} onChange={onSelectionChange ?? (() => undefined)} />}
    {warnings.length > 0 && <section><h3 className="mb-2 font-semibold">Plan checks</h3><DraftWarningList warnings={warnings} planNames={getPlanNames(catalog)} currency={catalog.organization.currency} label="Review checks" /></section>}
    <section className="border-t border-line pt-4" aria-label="Publication summary">
      <p className="font-medium" role="status" aria-live="polite">{summary}.</p>
      {changes.affectsAllCustomers && <p className="mt-2 text-caption text-ink-muted">Plan property changes also reach all {formatCount(changes.affectedCustomers, "customer")} at renewal, including customers keeping older features.</p>}
      {error && <p role="alert" className="mt-3 text-caption text-critical">{error}</p>}
      {movedCustomers > 0 && <p className="mt-2 text-caption text-ink-muted">Selected customers move immediately when you confirm. Updated counts are saved with these changes.</p>}
      <button type="button" className={`${primaryControlClass} mt-4 min-h-11 disabled:opacity-40`} disabled={changeCount === 0 || !migration.validTarget} onClick={publish}>{changes.changeCount === 0 ? "Confirm & move customers" : movedCustomers > 0 ? "Publish changes & move customers" : "Publish changes"}</button>
    </section>
  </ReviewDialog>;
}
