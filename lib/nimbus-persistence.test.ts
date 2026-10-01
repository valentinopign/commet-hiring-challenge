import { describe, expect, it, vi } from "vitest";
import { catalog } from "@/data/catalog";
import type { Catalog } from "@/lib/catalog";
import { createEditState, editPlanReducer } from "@/lib/edit-plan/changes";
import { addOnboardingPlan } from "@/lib/onboarding/add-plan";
import { createOrganizationStore, ORGANIZATION_SCHEMA_VERSION, ORGANIZATION_STORAGE_KEY } from "./organization-store";
import { NIMBUS_SEED_VERSION } from "./nimbus-seed";

const scheduledAt = "2026-10-01T18:00:00Z";
const builtInOrganizationId = catalog.organization.id;
function storage() {
  const values = new Map<string, string>();
  return { values, getItem: vi.fn((key: string) => values.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { values.set(key, value); }), removeItem: vi.fn((key: string) => { values.delete(key); }) };
}
function planOf(value: Catalog, code = "growth") {
  const plan = value.plans.find((entry) => entry.code === code);
  if (!plan) throw new Error("Missing plan fixture");
  return plan;
}

describe("Nimbus seeded persistence", () => {
  it("restores a created plan, plan-wide edit, new feature version and both forms of pending migration", () => {
    const adapter = storage();
    const options = { builtInOrganizationId, storage: () => adapter };
    const store = createOrganizationStore(options);
    const newDraft = { ...createEditState(catalog, planOf(catalog)).draft, code: "growth_plus", name: "Growth Plus" };
    const created = addOnboardingPlan(catalog, newDraft, scheduledAt);
    expect(store.saveCatalog(created)).toMatchObject({ ok: true, persistence: "local" });
    const original = planOf(created);
    const pricing = editPlanReducer(createEditState(created, original), { type: "set_price", interval: "monthly", price: 10800 });
    expect(store.publishEdit(builtInOrganizationId, { original, state: pricing, selectedVersions: [], scheduledAt })).toMatchObject({ ok: true, publication: { createsVersion: false } });
    const priced = store.getSnapshot().organizations[0];
    const pricedPlan = planOf(priced);
    const features = editPlanReducer(createEditState(priced, pricedPlan), { type: "set_feature", code: "ai_generation", feature: { code: "ai_generation", type: "credit", creditsPerUnit: 4 } });
    expect(store.publishEdit(builtInOrganizationId, { original: pricedPlan, state: features, selectedVersions: [1, 2], scheduledAt })).toMatchObject({ ok: true, persistence: "local", publication: { createsVersion: true, version: 4, movedCustomers: 352 } });
    const latest = store.getSnapshot().organizations[0];
    const starter = planOf(latest, "starter");
    expect(store.publishEdit(builtInOrganizationId, { original: starter, state: createEditState(latest, starter), selectedVersions: [1], targetVersion: 2, scheduledAt })).toMatchObject({ ok: true, publication: { createsVersion: false, movedCustomers: 86 } });

    const restored = createOrganizationStore(options);
    expect(restored.getSnapshot().organizations).toEqual([catalog]);
    restored.hydrate();
    const saved = restored.getSnapshot().organizations[0];
    expect(saved.plans.map((entry) => entry.code)).toContain("growth_plus");
    expect(planOf(saved).currentReleaseVersion).toBe(4);
    expect(planOf(saved).pricing).toMatchObject({ prices: expect.arrayContaining([expect.objectContaining({ billingInterval: "monthly", price: 10800 })]) });
    expect(saved.subscriptionsByRelease).toEqual(catalog.subscriptionsByRelease);
    expect(restored.getSnapshot().scheduledMigrations).toHaveLength(3);
    expect(restored.getSnapshot().scheduledMigrations).toContainEqual(expect.objectContaining({ organizationId: builtInOrganizationId, planCode: "starter", fromVersion: 1, toVersion: 2, customers: 86 }));
    expect(restored.getSnapshot().recovery).toBe("none");
    expect(planOf(catalog).currentReleaseVersion).toBe(3);
  });

  it("restores the changed seed while preserving local companies, their pending moves and active selection", () => {
    const adapter = storage();
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    const changed = structuredClone(catalog);
    changed.plans[0].name = "Saved Free";
    store.saveCatalog(changed);
    const local = structuredClone(catalog);
    local.organization.id = "org_local";
    store.saveCatalog(local);
    for (const value of [changed, local]) {
      const original = planOf(value);
      expect(store.publishEdit(value.organization.id, { original, state: createEditState(value, original), selectedVersions: [1], targetVersion: 3, scheduledAt }).ok).toBe(true);
    }
    const nextSeed = structuredClone(catalog);
    nextSeed.organization.name = "Nimbus refreshed";
    const options = { builtInOrganizationId, seedCatalog: nextSeed, seedVersion: NIMBUS_SEED_VERSION + 1, storage: () => adapter };
    const restored = createOrganizationStore(options);
    restored.hydrate();
    expect(restored.getSnapshot()).toMatchObject({ organizations: [nextSeed, local], activeOrganizationId: "org_local", recovery: "seed-changed", persistence: "local" });
    expect(restored.getSnapshot().scheduledMigrations).toEqual([expect.objectContaining({ organizationId: "org_local", fromVersion: 1, toVersion: 3 })]);
    expect(JSON.parse(adapter.values.get(ORGANIZATION_STORAGE_KEY) ?? "{}").seedVersion).toBe(NIMBUS_SEED_VERSION + 1);
    const again = createOrganizationStore(options);
    again.hydrate();
    expect(again.getSnapshot().recovery).toBe("none");
    expect(again.getSnapshot().organizations).toEqual([nextSeed, local]);
  });

  it("migrates schema 1 companies and pending moves without loading an unversioned Nimbus copy", () => {
    const adapter = storage();
    const local = structuredClone(catalog);
    local.organization.id = "org_local";
    adapter.values.set(ORGANIZATION_STORAGE_KEY, JSON.stringify({ version: 1, organizations: [local], activeOrganizationId: "org_local", scheduledMigrations: [{ organizationId: "org_local", planCode: "growth", fromVersion: 1, toVersion: 3, customers: 12, scheduledAt }] }));
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    store.hydrate();
    expect(store.getSnapshot()).toMatchObject({ organizations: [catalog, local], recovery: "none", activeOrganizationId: "org_local" });
    expect(store.getSnapshot().scheduledMigrations).toHaveLength(1);
    expect(JSON.parse(adapter.values.get(ORGANIZATION_STORAGE_KEY) ?? "{}")).toMatchObject({ version: ORGANIZATION_SCHEMA_VERSION, seedVersion: NIMBUS_SEED_VERSION });
  });

  it("rejects a corrupt saved Nimbus and its operations while retaining valid local data", () => {
    const adapter = storage();
    const local = structuredClone(catalog);
    local.organization.id = "org_local";
    adapter.values.set(ORGANIZATION_STORAGE_KEY, JSON.stringify({ version: ORGANIZATION_SCHEMA_VERSION, seedVersion: NIMBUS_SEED_VERSION, organizations: [{ ...catalog, plans: [{}] }, local], activeOrganizationId: builtInOrganizationId,
      scheduledMigrations: [{ organizationId: builtInOrganizationId, planCode: "growth", fromVersion: 1, toVersion: 3, customers: 12, scheduledAt }] }));
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    store.hydrate();
    expect(store.getSnapshot()).toMatchObject({ organizations: [catalog, local], recovery: "partial-data", scheduledMigrations: [] });
  });

  it("resets changed Nimbus and local companies to the seed without touching theme or other keys", () => {
    const adapter = storage();
    adapter.values.set("commet.theme", "dark");
    adapter.values.set("unrelated", "kept");
    const options = { builtInOrganizationId, storage: () => adapter };
    const store = createOrganizationStore(options);
    const changed = structuredClone(catalog);
    changed.organization.name = "Edited Nimbus";
    store.saveCatalog(changed);
    store.saveCatalog({ ...changed, organization: { ...changed.organization, id: "org_local" } });
    store.resetDemo();
    expect(store.getSnapshot()).toMatchObject({ organizations: [catalog], activeOrganizationId: builtInOrganizationId, scheduledMigrations: [] });
    expect(adapter.values).toEqual(new Map([["commet.theme", "dark"], ["unrelated", "kept"]]));
    const restored = createOrganizationStore(options);
    restored.hydrate();
    expect(restored.getSnapshot().organizations).toEqual([catalog]);
  });

  it("keeps the initial seed and later Nimbus publications in memory when writing fails", () => {
    const adapter = storage();
    adapter.setItem.mockImplementation(() => { throw new Error("Quota"); });
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    store.hydrate();
    expect(store.getSnapshot()).toMatchObject({ organizations: [catalog], persistence: "memory" });
    const original = planOf(catalog);
    const state = editPlanReducer(createEditState(catalog, original), { type: "set_name", name: "Updated Growth" });
    expect(store.publishEdit(builtInOrganizationId, { original, state, selectedVersions: [1], targetVersion: 3, scheduledAt })).toMatchObject({ ok: true, persistence: "memory" });
    expect(planOf(store.getSnapshot().organizations[0]).name).toBe("Updated Growth");
    expect(store.getSnapshot().scheduledMigrations).toHaveLength(1);
    expect(adapter.setItem).toHaveBeenCalledTimes(1);
  });
});
