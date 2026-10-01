import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { createOrganizationStore, ORGANIZATION_STORAGE_KEY } from "@/lib/organization-store";
import { createEditState, editPlanReducer } from "./changes";

describe("effective migrations in the shared browser store", () => {
  it.each([catalog.organization.id, "org_local"])("restores existing-version and new-version moves for %s after reload", (id) => {
    const values = new Map<string, string>([["theme", "dark"]]);
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const options = { builtInOrganizationId: catalog.organization.id, storage: () => storage };
    let store = createOrganizationStore(options);
    const initial = structuredClone(catalog);
    initial.organization.id = id;
    store.saveCatalog(initial);
    const original = initial.plans.find((entry) => entry.code === "growth");
    if (!original) throw new Error("Missing fixture");
    const draft = editPlanReducer(createEditState(initial, original), { type: "set_name", name: "Unsaved name" });
    const move = store.publishEdit(id, { original, state: createEditState(initial, original), selectedVersions: [1, 2], targetVersion: 3,
      scheduledAt: "2026-10-01T18:00:00Z", migrationTiming: "immediate", expectedMigrationCustomers: 352 });
    expect(move).toMatchObject({ ok: true, persistence: "local" });
    expect(draft.draft.name).toBe("Unsaved name");
    store = createOrganizationStore(options);
    store.hydrate();
    const saved = store.getSnapshot().organizations.find((entry) => entry.organization.id === id);
    if (!saved) throw new Error("Missing saved organization");
    const current = saved.plans.find((entry) => entry.code === "growth");
    if (!current) throw new Error("Missing saved plan");
    expect(current.name).toBe("Growth");
    expect(saved.subscriptionsByRelease.filter((row) => row.planCode === "growth")).toEqual([{ planCode: "growth", version: 3, subscriptions: 398 }]);
    const state = editPlanReducer(createEditState(saved, current), { type: "set_feature", code: "ai_generation", feature: { code: "ai_generation", type: "credit", creditsPerUnit: 4 } });
    expect(store.publishEdit(id, { original: current, state, selectedVersions: [3], targetVersion: 4,
      scheduledAt: "2026-10-01T18:05:00Z", migrationTiming: "immediate", expectedMigrationCustomers: 398 }).ok).toBe(true);
    store = createOrganizationStore(options);
    store.hydrate();
    const updated = store.getSnapshot().organizations.find((entry) => entry.organization.id === id);
    expect(updated?.plans.find((entry) => entry.code === "growth")?.currentReleaseVersion).toBe(4);
    expect(updated?.subscriptionsByRelease.filter((row) => row.planCode === "growth")).toEqual([{ planCode: "growth", version: 4, subscriptions: 398 }]);
    expect(store.getSnapshot().scheduledMigrations).toEqual([]);
    expect(store.getSnapshot().recovery).toBe("none");
    expect(JSON.parse(values.get(ORGANIZATION_STORAGE_KEY) ?? "{}").organizations).toEqual(store.getSnapshot().organizations);
    expect(values.get("theme")).toBe("dark");
  });

  it("reports session-only persistence while still applying the migration if browser writing fails", () => {
    const store = createOrganizationStore({ builtInOrganizationId: catalog.organization.id, storage: () => ({ getItem: () => null,
      setItem: () => { throw new Error("Quota exceeded"); }, removeItem: () => {} }) });
    const original = catalog.plans.find((entry) => entry.code === "growth");
    if (!original) throw new Error("Missing fixture");
    const result = store.publishEdit(catalog.organization.id, { original, state: createEditState(catalog, original), selectedVersions: [1, 2],
      targetVersion: 3, scheduledAt: "2026-10-01T18:00:00Z", migrationTiming: "immediate" });
    expect(result).toMatchObject({ ok: true, persistence: "memory" });
    expect(store.getSnapshot().organizations[0].subscriptionsByRelease.filter((row) => row.planCode === "growth")).toEqual([{ planCode: "growth", version: 3, subscriptions: 398 }]);
  });
});
