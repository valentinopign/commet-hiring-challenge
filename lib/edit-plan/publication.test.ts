import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import type { Catalog } from "@/lib/catalog";
import { createEditState, editPlanReducer } from "./changes";
import { describePublication, deriveMigrationSelection, getMigrationOptions, isScheduledMigration, publishPlanEdit, type EditPublicationRequest, type ScheduledMigration } from "./publication";

const original = catalog.plans.find((plan) => plan.code === "growth");
if (!original) throw new Error("Missing Growth fixture");
const plan = original;
function request(features = true): EditPublicationRequest {
  const state = features ? editPlanReducer(createEditState(catalog, plan), { type: "set_feature", code: "ai_generation", feature: { code: "ai_generation", type: "credit", creditsPerUnit: 4 } })
    : editPlanReducer(createEditState(catalog, plan), { type: "set_price", interval: "monthly", price: 10000 });
  return { original: plan, state, selectedVersions: [], scheduledAt: "2026-10-01T16:00:00.000Z" };
}
function success(input = request(), schedules: ScheduledMigration[] = []) {
  const result = publishPlanEdit(catalog, schedules, input);
  if (!result.ok) throw new Error(result.reason);
  return result.publication;
}

describe("edit publication and scheduled migrations", () => {
  it("publishes exactly the next feature version, retires the current one and preserves the input", () => {
    const before = structuredClone(catalog);
    const publication = success();
    const updated = publication.catalog.plans.find((entry) => entry.code === "growth");
    expect(updated?.currentReleaseVersion).toBe(4);
    expect(updated?.releases.map((release) => [release.version, release.status])).toEqual([[1, "retired"], [2, "retired"], [3, "retired"], [4, "published"]]);
    expect(updated?.releases.at(-1)?.features).toEqual(request().state.draft.features);
    expect(publication.schedules).toEqual([]);
    expect(publication.catalog.subscriptionsByRelease).toEqual(catalog.subscriptionsByRelease);
    expect(catalog).toEqual(before);
  });
  it("updates plan prices without creating a release and retains billing identities, defaults and packs", () => {
    const publication = success(request(false));
    const updated = publication.catalog.plans.find((entry) => entry.code === "growth");
    expect(updated?.releases).toEqual(plan.releases);
    expect(publication.createsVersion).toBe(false);
    expect(publication.affectedCustomers).toBe(398);
    if (updated?.pricing.type !== "standard" || plan.pricing.type !== "standard") throw new Error("Missing pricing");
    expect(updated.pricing.prices.map(({ id, isDefault, billingInterval }) => ({ id, isDefault, billingInterval }))).toEqual(plan.pricing.prices.map(({ id, isDefault, billingInterval }) => ({ id, isDefault, billingInterval })));
    expect(publication.catalog.creditPacks).toEqual(catalog.creditPacks);
    expect(describePublication(publication)).toBe("Plan updated; no new version");
  });
  it("schedules selected source populations while leaving current counts unchanged", () => {
    const input = { ...request(), selectedVersions: [1, 2] };
    const publication = success(input);
    expect(publication.movedCustomers).toBe(352);
    expect(publication.schedules.map((item) => [item.fromVersion, item.toVersion, item.customers])).toEqual([[1, 4, 12], [2, 4, 340]]);
    expect(publication.catalog.subscriptionsByRelease).toEqual(catalog.subscriptionsByRelease);
    expect(publication.schedules.every((item) => isScheduledMigration(item, [publication.catalog]))).toBe(true);
    expect(describePublication(publication, true)).toContain("scheduled 352 customers from v1 and v2 to move at their next renewal");
  });
  it("allows scheduling today's current version too, with source-specific feature impacts", () => {
    expect(success({ ...request(), selectedVersions: [3] }).movedCustomers).toBe(46);
    const options = getMigrationOptions(catalog, plan, request().state.draft.features, []);
    expect(options.find((option) => option.version === 3)?.current).toBe(true);
    expect(options.find((option) => option.version === 2)?.changes.find((change) => change.feature.code === "ai_generation")?.impact).toBe("better");
    const expensive = request().state.draft.features.map((feature) => feature.type === "credit" && feature.code === "ai_generation" ? { ...feature, creditsPerUnit: 99 } : feature);
    expect(getMigrationOptions(catalog, plan, expensive, [])[0].changes.some((change) => change.impact === "worse")).toBe(true);
  });
  it("combines plan-wide renewal changes with the optional feature migration", () => {
    const input = request();
    input.state = editPlanReducer(input.state, { type: "set_included_credits", interval: "monthly", credits: 13000 });
    input.selectedVersions = [2];
    const publication = success(input);
    expect(publication.affectedCustomers).toBe(398);
    expect(publication.movedCustomers).toBe(340);
  });
  it("rejects empty or effectively reverted edits and incomplete input", () => {
    expect(publishPlanEdit(catalog, [], { ...request(), state: createEditState(catalog, plan) })).toEqual({ ok: false, reason: "no-changes" });
    const input = request(false);
    input.state = editPlanReducer(input.state, { type: "set_price", interval: "monthly", price: null });
    expect(publishPlanEdit(catalog, [], input)).toEqual({ ok: false, reason: "invalid-edit" });
  });
  it("rejects stale baselines instead of overwriting a newer plan", () => {
    const latest = structuredClone(catalog);
    const changed = latest.plans.find((entry) => entry.code === plan.code);
    if (changed) changed.name = "Updated elsewhere";
    expect(publishPlanEdit(latest, [], request()).ok).toBe(false);
    expect(publishPlanEdit(latest, [], request())).toEqual({ ok: false, reason: "stale-plan" });
  });
  it("rejects code, billing period, price identity, pack and catalog-feature changes", () => {
    for (const tamper of [
      (input: EditPublicationRequest) => { input.state.draft.code = "other"; },
      (input: EditPublicationRequest) => { if (input.state.draft.pricing.type === "standard") input.state.draft.pricing.prices[0].id = "new"; },
      (input: EditPublicationRequest) => { if (input.state.draft.pricing.type === "standard") input.state.draft.pricing.prices[0].billingInterval = "yearly"; },
      (input: EditPublicationRequest) => { input.state.draft.creditPackCodes = []; },
      (input: EditPublicationRequest) => { input.state.draft.features.push({ code: "unknown", type: "boolean", enabled: true }); },
    ]) { const input = request(); tamper(input); expect(publishPlanEdit(catalog, [], input)).toEqual({ ok: false, reason: "invalid-edit" }); }
  });
  it("rejects duplicate or unknown source versions", () => {
    for (const input of [{ ...request(), selectedVersions: [1, 1] }, { ...request(), selectedVersions: [99] }]) {
      expect(publishPlanEdit(catalog, [], input)).toEqual({ ok: false, reason: "invalid-migration" });
    }
  });
  it("schedules migration only to the current version without changing plan configuration or counts", () => {
    const publication = success({ ...request(), state: createEditState(catalog, plan), selectedVersions: [1, 2] });
    expect(publication.catalog).toEqual(catalog);
    expect(publication).toMatchObject({ createsVersion: false, version: 3, migrationTargetVersion: 3, movedCustomers: 352, affectedCustomers: 0 });
    expect(publication.schedules.map((item) => item.toVersion)).toEqual([3, 3]);
    expect(describePublication(publication, true)).toBe("Moves 352 customers from v1 and v2 to v3 at their next renewal; no new version");
    expect(describePublication({ ...publication, movedCustomers: 1, fromVersions: [1] }, true)).toBe("Moves 1 customer from v1 to v3 at their next renewal; no new version");
  });
  it("allows an intermediate destination without changing the current release", () => {
    const publication = success({ ...request(), state: createEditState(catalog, plan), targetVersion: 2, selectedVersions: [1] });
    expect(publication.migrationTargetVersion).toBe(2);
    expect(publication.version).toBe(3);
    expect(publication.catalog).toEqual(catalog);
    expect(publication.schedules[0]).toMatchObject({ fromVersion: 1, toVersion: 2, customers: 12 });
    expect(describePublication(publication)).toContain("to v2 at their next renewal; no new version");
  });
  it("rejects same-version, backward and nonexistent destinations at the publication boundary", () => {
    const base = { ...request(), state: createEditState(catalog, plan) };
    for (const selection of [{ targetVersion: 2, selectedVersions: [2] }, { targetVersion: 2, selectedVersions: [3] }, { targetVersion: 1, selectedVersions: [2] }, { targetVersion: 99, selectedVersions: [1] }]) {
      expect(publishPlanEdit(catalog, [], { ...base, ...selection })).toEqual({ ok: false, reason: "invalid-migration" });
    }
  });
  it("filters source selection as targets change or feature changes are reverted", () => {
    const initial = createEditState(catalog, plan);
    const intermediate = deriveMigrationSelection(catalog, plan, initial, [], 2, [1, 2]);
    expect(intermediate.selectedVersions).toEqual([1]);
    expect(intermediate.customers).toBe(12);
    expect(intermediate.options.map((option) => option.version)).toEqual([1]);
    expect(intermediate.destinations.map((release) => release.version)).toEqual([2, 3]);
    const next = deriveMigrationSelection(catalog, plan, request().state, [], 2, [1, 2, 3]);
    expect(next.targetVersion).toBe(4);
    expect(next.operationCount).toBe(3);
    expect(next.customers).toBe(398);
    const reverted = deriveMigrationSelection(catalog, plan, initial, [], 3, [1, 2, 3]);
    expect(reverted.selectedVersions).toEqual([1, 2]);
    expect(reverted.customers).toBe(352);
    expect(publishPlanEdit(catalog, [], { ...request(), targetVersion: 2, selectedVersions: [1] })).toEqual({ ok: false, reason: "invalid-migration" });
  });
  it("can combine price-only editing and forward migration", () => {
    const publication = success({ ...request(false), selectedVersions: [2], targetVersion: 3 });
    expect(publication).toMatchObject({ createsVersion: false, affectedCustomers: 398, movedCustomers: 340 });
    expect(publication.catalog.plans.find((entry) => entry.code === plan.code)?.releases).toEqual(plan.releases);
  });
  it("prevents re-scheduling a source already pending and retains other operations", () => {
    const first = success({ ...request(), selectedVersions: [2] });
    const updated = first.catalog.plans.find((entry) => entry.code === "growth");
    if (!updated) throw new Error("Missing updated plan");
    const state = editPlanReducer(createEditState(first.catalog, updated), { type: "set_feature", code: "ai_generation", feature: { code: "ai_generation", type: "credit", creditsPerUnit: 3 } });
    const next = { ...request(), original: updated, state, selectedVersions: [2] };
    expect(publishPlanEdit(first.catalog, first.schedules, next)).toEqual({ ok: false, reason: "invalid-migration" });
    const result = publishPlanEdit(first.catalog, first.schedules, { ...next, selectedVersions: [3] });
    if (!result.ok) throw new Error(result.reason);
    expect(result.publication.schedules.map((item) => [item.fromVersion, item.toVersion])).toEqual([[2, 4], [3, 5]]);
  });
  it("rejects empty populations and malformed persisted schedule references or counts", () => {
    const empty = structuredClone(catalog);
    empty.subscriptionsByRelease = [];
    expect(publishPlanEdit(empty, [], { ...request(), selectedVersions: [1] })).toEqual({ ok: false, reason: "invalid-migration" });
    const publication = success({ ...request(), selectedVersions: [1] });
    const item = publication.schedules[0];
    for (const invalid of [null, { ...item, toVersion: 99 }, { ...item, customers: 13 }, { ...item, customers: 0 }, { ...item, organizationId: "other" }, { ...item, scheduledAt: "bad" }, { ...item, toVersion: 1 }]) {
      expect(isScheduledMigration(invalid, [publication.catalog])).toBe(false);
    }
  });
  it("updates free-plan credits without adding paid billing or a new version", () => {
    const free = catalog.plans.find((entry) => entry.code === "free");
    if (!free) throw new Error("Missing Free fixture");
    const state = editPlanReducer(createEditState(catalog, free), { type: "set_included_credits", interval: "monthly", credits: 600 });
    const result = publishPlanEdit(catalog, [], { ...request(), original: free, state });
    if (!result.ok) throw new Error(result.reason);
    const updated = result.publication.catalog.plans.find((entry) => entry.code === "free");
    expect(updated?.pricing).toEqual({ type: "free", includedCredits: 600 });
    expect(updated?.releases).toEqual(free.releases);
    expect(result.publication.createsVersion).toBe(false);
  });
  it("publishes a local company identity edit with no features or customers", () => {
    const local: Catalog = structuredClone(catalog);
    local.organization.id = "org_empty";
    local.features = [];
    local.creditPacks = [];
    local.subscriptionsByRelease = [];
    local.plans = [{ ...structuredClone(plan), releases: [{ version: 1, status: "published", publishedAt: "2026-10-01T16:00:00Z", features: [] }], currentReleaseVersion: 1 }];
    const original = local.plans[0];
    const state = editPlanReducer(createEditState(local, original), { type: "set_name", name: "Local plan" });
    const result = publishPlanEdit(local, [], { ...request(), original, state });
    if (!result.ok) throw new Error(result.reason);
    expect(result.publication).toMatchObject({ createsVersion: false, affectedCustomers: 0, movedCustomers: 0, schedules: [] });
    expect(result.publication.catalog.plans[0].name).toBe("Local plan");
  });
});
