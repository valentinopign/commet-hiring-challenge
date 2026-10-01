import { describe, expect, it, vi } from "vitest";
import { catalog } from "@/data/catalog";
import { createOrganizationStore, ORGANIZATION_STORAGE_KEY } from "@/lib/organization-store";
import { createEditState, editPlanReducer } from "./changes";
import { publishPlanEdit, type EditPublicationRequest } from "./publication";

function fixture() {
  const local = structuredClone(catalog);
  local.organization.id = "org_local";
  const plan = local.plans.find((entry) => entry.code === "growth");
  if (!plan) throw new Error("Missing fixture");
  const request: EditPublicationRequest = { original: plan,
    state: editPlanReducer(createEditState(local, plan), { type: "set_feature", code: "ai_generation", feature: { code: "ai_generation", type: "credit", creditsPerUnit: 4 } }),
    selectedVersions: [1, 2], scheduledAt: "2026-10-01T16:00:00Z" };
  let raw: string | null = null;
  const adapter = { getItem: () => raw, setItem: vi.fn((_key: string, value: string) => { raw = value; }), removeItem: () => { raw = null; } };
  const store = createOrganizationStore({ builtInOrganizationId: catalog.organization.id, storage: () => adapter });
  return { local, request, adapter, store };
}

describe("publication persistence boundary", () => {
  it("saves catalog and schedules in one write and restores both on reload", () => {
    const { local, request, adapter, store } = fixture();
    store.saveCatalog(local);
    adapter.setItem.mockClear();
    expect(store.publishEdit(local.organization.id, request)).toMatchObject({ ok: true, persistence: "local" });
    expect(adapter.setItem).toHaveBeenCalledTimes(1);
    const restored = createOrganizationStore({ builtInOrganizationId: catalog.organization.id, storage: () => adapter });
    restored.hydrate();
    expect(restored.getSnapshot().recovery).toBe("none");
    expect(restored.getSnapshot().organizations[0].plans.find((plan) => plan.code === "growth")?.currentReleaseVersion).toBe(4);
    expect(restored.getSnapshot().scheduledMigrations).toHaveLength(2);
    expect(restored.getSnapshot().organizations[0].subscriptionsByRelease).toEqual(local.subscriptionsByRelease);
  });
  it("reads older organization envelopes without scheduling data", () => {
    const { local, adapter } = fixture();
    adapter.setItem(ORGANIZATION_STORAGE_KEY, JSON.stringify({ version: 1, organizations: [local], activeOrganizationId: local.organization.id }));
    const restored = createOrganizationStore({ builtInOrganizationId: catalog.organization.id, storage: () => adapter });
    restored.hydrate();
    expect(restored.getSnapshot()).toMatchObject({ recovery: "none", scheduledMigrations: [] });
  });
  it("uses the latest organization and rejects stale edits without a write", () => {
    const { local, request, adapter, store } = fixture();
    store.saveCatalog(local);
    const newer = structuredClone(local);
    newer.plans[2].name = "Newer name";
    store.saveCatalog(newer);
    adapter.setItem.mockClear();
    expect(store.publishEdit(local.organization.id, request)).toEqual({ ok: false, reason: "stale-plan" });
    expect(adapter.setItem).not.toHaveBeenCalled();
  });
  it("keeps unrelated plan edits and organizations when publishing", () => {
    const { local, request, store } = fixture();
    store.saveCatalog(local);
    const latest = structuredClone(local);
    latest.plans[0].name = "Changed Free";
    store.saveCatalog(latest);
    const other = structuredClone(local);
    other.organization.id = "org_other";
    store.saveCatalog(other);
    expect(store.publishEdit(local.organization.id, request).ok).toBe(true);
    expect(store.getSnapshot().organizations[0].plans[0].name).toBe("Changed Free");
    expect(store.getSnapshot().organizations[1]).toEqual(other);
  });
  it("retains a complete session transaction when localStorage writes fail", () => {
    const { local, request, adapter, store } = fixture();
    store.saveCatalog(local);
    adapter.setItem.mockImplementation(() => { throw new Error("Unavailable"); });
    expect(store.publishEdit(local.organization.id, request)).toMatchObject({ ok: true, persistence: "memory" });
    expect(store.getSnapshot().scheduledMigrations).toHaveLength(2);
    expect(store.getSnapshot().organizations[0].plans.find((plan) => plan.code === "growth")?.currentReleaseVersion).toBe(4);
  });
  it("skips invalid/duplicate schedules, retaining valid catalogs and reporting partial recovery", () => {
    const { local, request, adapter } = fixture();
    const result = publishPlanEdit(local, [], request);
    if (!result.ok) throw new Error(result.reason);
    const item = result.publication.schedules[0];
    adapter.setItem(ORGANIZATION_STORAGE_KEY, JSON.stringify({ version: 1, organizations: [result.publication.catalog], activeOrganizationId: local.organization.id,
      scheduledMigrations: [item, item, { ...item, toVersion: 99 }, result.publication.schedules[1]] }));
    const restored = createOrganizationStore({ builtInOrganizationId: catalog.organization.id, storage: () => adapter });
    restored.hydrate();
    expect(restored.getSnapshot()).toMatchObject({ recovery: "partial-data" });
    expect(restored.getSnapshot().scheduledMigrations).toHaveLength(2);
    expect(restored.getSnapshot().organizations).toHaveLength(1);
  });
  it("protects Nimbus and removes schedules with Reset demo", () => {
    const { local, request, store } = fixture();
    expect(store.publishEdit(catalog.organization.id, request)).toEqual({ ok: false, reason: "unknown-organization" });
    store.saveCatalog(local);
    store.publishEdit(local.organization.id, request);
    store.resetDemo();
    expect(store.getSnapshot()).toMatchObject({ organizations: [], scheduledMigrations: [] });
    expect(catalog.plans.find((plan) => plan.code === "growth")?.currentReleaseVersion).toBe(3);
  });
  it("restores migration-only operations toward an intermediate version without publishing a release", () => {
    const { local, request, adapter, store } = fixture();
    const migrationOnly = { ...request, state: createEditState(local, request.original), selectedVersions: [1], targetVersion: 2 };
    store.saveCatalog(local);
    expect(store.publishEdit(local.organization.id, migrationOnly)).toMatchObject({ ok: true, publication: { createsVersion: false, migrationTargetVersion: 2 } });
    const restored = createOrganizationStore({ builtInOrganizationId: catalog.organization.id, storage: () => adapter });
    restored.hydrate();
    expect(restored.getSnapshot().organizations[0]).toEqual(local);
    expect(restored.getSnapshot().scheduledMigrations).toEqual([expect.objectContaining({ fromVersion: 1, toVersion: 2, customers: 12 })]);
    expect(restored.getSnapshot().recovery).toBe("none");
  });
});
