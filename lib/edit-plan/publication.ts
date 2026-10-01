import type { Catalog, Plan, ReleaseFeature } from "@/lib/catalog";
import type { DraftFlowState } from "@/lib/create-plan/draft-reducer";
import { createEditState, deriveEditChecks, derivePlanChanges, validatePlanEdit } from "@/lib/edit-plan/changes";
import { diffFeatureSets, getCurrentRelease, resolveReleaseFeatures } from "@/lib/derive/releases";
import { isCatalog } from "@/lib/validate-catalog";
import { formatCount } from "@/lib/format";

/** Scheduling is operational state; subscriptions do not move until their renewal. */
export type ScheduledMigration = {
  organizationId: string; planCode: string; fromVersion: number; toVersion: number;
  customers: number; scheduledAt: string;
};
export type EditPublicationRequest = { original: Plan; state: DraftFlowState; selectedVersions: number[]; targetVersion?: number; scheduledAt: string };
export type EditPublication = {
  catalog: Catalog; schedules: ScheduledMigration[]; name: string; version: number;
  createsVersion: boolean; affectedCustomers: number; movedCustomers: number; fromVersions: number[]; migrationTargetVersion: number;
};
export type PublicationResult = { ok: true; publication: EditPublication; persistence?: "local" | "memory" }
  | { ok: false; reason: "stale-plan" | "invalid-edit" | "no-changes" | "invalid-migration" | "unknown-organization" };

export function getMigrationOptions(catalog: Catalog, plan: Plan, targetFeatures: ReleaseFeature[], schedules: readonly ScheduledMigration[]) {
  const target = resolveReleaseFeatures(catalog.features, targetFeatures);
  return plan.releases.filter((release) => release.status !== "building").map((release) => {
    const customers = catalog.subscriptionsByRelease.filter((row) => row.planCode === plan.code && row.version === release.version).reduce((total, row) => total + row.subscriptions, 0);
    const scheduled = schedules.filter((item) => item.organizationId === catalog.organization.id && item.planCode === plan.code && item.fromVersion === release.version);
    return { version: release.version, customers, current: release.version === plan.currentReleaseVersion,
      scheduled, disabled: customers === 0 || scheduled.length > 0,
      changes: diffFeatureSets(resolveReleaseFeatures(catalog.features, release.features), target) };
  });
}

/** Only forward moves are eligible, whether the destination already exists or is being published. */
export function deriveMigrationSelection(catalog: Catalog, plan: Plan, state: DraftFlowState, schedules: readonly ScheduledMigration[], requestedTarget: number, selectedVersions: number[]) {
  const changes = derivePlanChanges(catalog, plan, state.draft, state.pending);
  const destinations = plan.releases.filter((release) => release.status !== "building").sort((a, b) => a.version - b.version);
  const targetVersion = changes.createsVersion ? changes.nextVersion : requestedTarget;
  const destination = destinations.find((release) => release.version === targetVersion);
  const validTarget = changes.createsVersion || destination !== undefined;
  const targetFeatures = changes.createsVersion ? state.draft.features : destination?.features ?? [];
  const allOptions = getMigrationOptions(catalog, plan, targetFeatures, schedules);
  const options = validTarget ? allOptions.filter((option) => option.version < targetVersion && option.customers > 0) : [];
  const selected = options.filter((option) => selectedVersions.includes(option.version) && !option.disabled);
  return { targetVersion, targetFeatures, validTarget, destinations: destinations.filter((release) => allOptions.some((source) => source.version < release.version && !source.disabled)), options,
    selectedVersions: selected.map((option) => option.version), operationCount: selected.length,
    customers: selected.reduce((total, option) => total + option.customers, 0) };
}

export function isScheduledMigration(value: unknown, catalogs: readonly Catalog[]): value is ScheduledMigration {
  if (typeof value !== "object" || value === null) return false;
  if (!("organizationId" in value) || typeof value.organizationId !== "string" || !("planCode" in value) || typeof value.planCode !== "string"
    || !("fromVersion" in value) || typeof value.fromVersion !== "number" || !("toVersion" in value) || typeof value.toVersion !== "number"
    || !("customers" in value) || typeof value.customers !== "number" || !Number.isSafeInteger(value.customers) || value.customers <= 0
    || !("scheduledAt" in value) || typeof value.scheduledAt !== "string" || !Number.isFinite(Date.parse(value.scheduledAt))) return false;
  const catalog = catalogs.find((entry) => entry.organization.id === value.organizationId);
  const plan = catalog?.plans.find((entry) => entry.code === value.planCode);
  const source = plan?.releases.find((entry) => entry.version === value.fromVersion);
  const target = plan?.releases.find((entry) => entry.version === value.toVersion);
  const customers = catalog?.subscriptionsByRelease.filter((row) => row.planCode === value.planCode && row.version === value.fromVersion).reduce((total, row) => total + row.subscriptions, 0) ?? 0;
  return Boolean(source && target && source.status !== "building" && target.status !== "building" && value.fromVersion < value.toVersion && value.customers <= customers);
}

/** Validate against the latest plan, then return one immutable catalog + scheduling transaction. */
export function publishPlanEdit(catalog: Catalog, schedules: readonly ScheduledMigration[], request: EditPublicationRequest): PublicationResult {
  const { original, state, selectedVersions, scheduledAt } = request;
  const plan = catalog.plans.find((entry) => entry.code === original.code);
  if (!plan || JSON.stringify(plan) !== JSON.stringify(original)) return { ok: false, reason: "stale-plan" };
  const baseline = createEditState(catalog, plan).draft;
  const draft = state.draft;
  const structure = (pricing: Plan["pricing"]) => pricing.type === "free" ? "free" : pricing.prices.map(({ id, billingInterval, isDefault }) => ({ id, billingInterval, isDefault }));
  if (getCurrentRelease(plan)?.status !== "published" || validatePlanEdit(state).length > 0 || deriveEditChecks(catalog, plan, state).warnings.some((warning) => warning.severity === "blocking") || !Number.isFinite(Date.parse(scheduledAt))
    || draft.code !== plan.code || JSON.stringify(structure(draft.pricing)) !== JSON.stringify(structure(plan.pricing))
    || JSON.stringify(draft.creditPackCodes) !== JSON.stringify(baseline.creditPackCodes)) return { ok: false, reason: "invalid-edit" };
  const changes = derivePlanChanges(catalog, plan, draft, state.pending);
  const migration = deriveMigrationSelection(catalog, plan, state, schedules, request.targetVersion ?? plan.currentReleaseVersion, selectedVersions);
  if (!migration.validTarget || (changes.createsVersion && request.targetVersion !== undefined && request.targetVersion !== changes.nextVersion)
    || new Set(selectedVersions).size !== selectedVersions.length || migration.operationCount !== selectedVersions.length) return { ok: false, reason: "invalid-migration" };
  if (!changes.changeCount && !migration.operationCount) return { ok: false, reason: "no-changes" };
  const selected = migration.options.filter((option) => migration.selectedVersions.includes(option.version));
  const version = changes.createsVersion ? changes.nextVersion : plan.currentReleaseVersion;
  const updated: Plan = { ...structuredClone(plan), name: draft.name.trim(), isPublic: draft.isPublic,
    pricing: structuredClone(draft.pricing), exhaustionPolicy: structuredClone(draft.exhaustionPolicy) };
  if (changes.createsVersion) {
    const [first, ...rest] = updated.releases;
    const retire = (release: typeof first) => release.status === "published" ? { ...release, status: "retired" as const } : release;
    updated.releases = [retire(first), ...rest.map(retire), { version, status: "published", publishedAt: scheduledAt, features: structuredClone(draft.features) }];
    updated.currentReleaseVersion = version;
  }
  const nextCatalog: Catalog = { ...structuredClone(catalog), plans: catalog.plans.map((entry) => entry.code === plan.code ? updated : structuredClone(entry)) };
  if (!isCatalog(nextCatalog)) return { ok: false, reason: "invalid-edit" };
  const nextSchedules = [...structuredClone(schedules), ...selected.map((option) => ({ organizationId: catalog.organization.id, planCode: plan.code,
    fromVersion: option.version, toVersion: migration.targetVersion, customers: option.customers, scheduledAt }))];
  return { ok: true, publication: { catalog: nextCatalog, schedules: nextSchedules, name: updated.name, version,
    createsVersion: changes.createsVersion, affectedCustomers: changes.affectedCustomers,
    movedCustomers: migration.customers, fromVersions: migration.selectedVersions, migrationTargetVersion: migration.targetVersion } };
}

export function describePublication(publication: Pick<EditPublication, "createsVersion" | "name" | "version" | "movedCustomers" | "fromVersions"> & { migrationTargetVersion?: number }, published = false) {
  const versions = publication.fromVersions.map((version) => `v${version}`);
  const sources = versions.length > 1 ? `${versions.slice(0, -1).join(", ")} and ${versions.at(-1)}` : versions[0];
  if (!publication.createsVersion) return publication.movedCustomers > 0
    ? `Moves ${formatCount(publication.movedCustomers, "customer")} from ${sources} to v${publication.migrationTargetVersion ?? publication.version} at their next renewal; no new version`
    : "Plan updated; no new version";
  return `${published ? "Published" : "Publishes"} ${publication.name} v${publication.version}${publication.movedCustomers > 0
    ? ` and ${published ? "scheduled" : "schedules"} ${formatCount(publication.movedCustomers, "customer")} from ${sources} to move at their next renewal` : " for new customers only"}`;
}
