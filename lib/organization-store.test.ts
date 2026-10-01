import { describe, expect, it, vi } from "vitest";
import type { Catalog } from "@/lib/catalog";
import { catalog as nimbus } from "@/data/catalog";
import { createOrganizationStore, ORGANIZATION_SCHEMA_VERSION, ORGANIZATION_STORAGE_KEY } from "./organization-store";
import { NIMBUS_SEED_VERSION } from "./nimbus-seed";

const builtInOrganizationId = nimbus.organization.id;
function company(id = "org_new"): Catalog {
  return { organization: { id, name: "New company", description: "", currency: "USD" }, features: [], plans: [], creditPacks: [], subscriptionsByRelease: [] };
}
function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    removeItem: vi.fn((key: string) => { values.delete(key); }),
  };
}
function payload(organizations: unknown[], activeOrganizationId = "org_new", version = ORGANIZATION_SCHEMA_VERSION) {
  return JSON.stringify({ version, seedVersion: NIMBUS_SEED_VERSION, organizations: version === 1 ? organizations : [nimbus, ...organizations], activeOrganizationId });
}

describe("organization store", () => {
  it("does not access browser storage before hydration and keeps snapshot identity stable", () => {
    const getter = vi.fn(() => storage());
    const store = createOrganizationStore({ builtInOrganizationId, storage: getter });
    const initial = store.getSnapshot();
    expect(getter).not.toHaveBeenCalled();
    expect(initial).toMatchObject({ hydrated: false, organizations: [nimbus], activeOrganizationId: builtInOrganizationId });
    expect(initial.organizations[0]).not.toBe(nimbus);
    expect(Object.isFrozen(initial.organizations[0].plans[0].releases[0].features)).toBe(true);
    expect(store.getSnapshot()).toBe(initial);
    store.hydrate();
    store.hydrate();
    expect(getter).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toMatchObject({ hydrated: true, persistence: "local" });
    expect(store.getServerSnapshot()).toBe(initial);
    expect(store.getServerSnapshot().hydrated).toBe(false);
  });
  it("hydrates an empty browser to the seed and writes it only after hydration", () => {
    const adapter = storage();
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    expect(adapter.getItem).not.toHaveBeenCalled();
    expect(adapter.setItem).not.toHaveBeenCalled();
    store.hydrate();
    expect(store.getSnapshot()).toMatchObject({ organizations: [nimbus], scheduledMigrations: [], recovery: "none" });
    expect(adapter.getItem).toHaveBeenCalledExactlyOnceWith(ORGANIZATION_STORAGE_KEY);
    expect(adapter.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(adapter.values.get(ORGANIZATION_STORAGE_KEY) ?? "{}")).toMatchObject({ version: ORGANIZATION_SCHEMA_VERSION, seedVersion: NIMBUS_SEED_VERSION, organizations: [nimbus] });
  });
  it("works without window or a storage adapter", () => {
    const store = createOrganizationStore({ builtInOrganizationId });
    store.hydrate();
    expect(store.getSnapshot().persistence).toBe("memory");
    expect(store.saveCatalog(company())).toEqual({ ok: true, persistence: "memory" });
  });
  it("saves versioned catalogs, restores them after recreation and preserves unrelated preferences", () => {
    const adapter = storage();
    adapter.values.set("theme", "light");
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    expect(store.saveCatalog(company())).toEqual({ ok: true, persistence: "local" });
    store.saveCatalog(company("org_second"));
    store.selectOrganization("org_new");
    const restored = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    restored.hydrate();
    expect(restored.getSnapshot()).toMatchObject({ activeOrganizationId: "org_new", recovery: "none" });
    expect(restored.getSnapshot().organizations).toHaveLength(3);
    expect(JSON.parse(adapter.values.get(ORGANIZATION_STORAGE_KEY) ?? "{}").version).toBe(ORGANIZATION_SCHEMA_VERSION);
    expect(adapter.values.get("theme")).toBe("light");
  });
  it("updates the same organization without duplicating it or mutating caller data", () => {
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => null });
    const input = company();
    store.saveCatalog(input);
    input.organization.name = "Changed outside";
    expect(store.getSnapshot().organizations.find((entry) => entry.organization.id === input.organization.id)?.organization.name).toBe("New company");
    store.saveCatalog(input, false);
    expect(store.getSnapshot().organizations).toHaveLength(2);
    expect(store.getSnapshot().organizations[1].organization.name).toBe("Changed outside");
    expect(() => { store.getSnapshot().organizations[1].organization.name = "Mutation"; }).toThrow();
  });
  it.each(["not JSON", "null", "[]", "{}", JSON.stringify({ version: 1, organizations: null, activeOrganizationId: "org_new" })])("ignores corrupt envelopes: %s", (raw) => {
    const adapter = storage();
    adapter.values.set(ORGANIZATION_STORAGE_KEY, raw);
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    expect(() => store.hydrate()).not.toThrow();
    expect(store.getSnapshot()).toMatchObject({ organizations: [nimbus], recovery: "invalid-data", activeOrganizationId: builtInOrganizationId });
  });
  it("ignores unsupported versions instead of guessing a migration", () => {
    const adapter = storage();
    adapter.values.set(ORGANIZATION_STORAGE_KEY, payload([company()], "org_new", 999));
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    store.hydrate();
    expect(store.getSnapshot()).toMatchObject({ organizations: [nimbus], recovery: "unsupported-version" });
  });
  it("retains valid Nimbus and local entries, rejects corrupt/duplicate ones and repairs invalid active selection", () => {
    const adapter = storage();
    adapter.values.set(ORGANIZATION_STORAGE_KEY, payload([company(), {}, company(), nimbus], "missing"));
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    store.hydrate();
    expect(store.getSnapshot()).toMatchObject({ organizations: [nimbus, company()], recovery: "partial-data", activeOrganizationId: builtInOrganizationId });
  });
  it.each(["getter", "read", "write"])("continues in memory if storage fails during %s", (operation) => {
    const adapter = storage();
    if (operation === "read") adapter.getItem.mockImplementation(() => { throw new Error("Blocked"); });
    if (operation === "write") adapter.setItem.mockImplementation(() => { throw new Error("Quota"); });
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => {
      if (operation === "getter") throw new Error("Blocked");
      return adapter;
    } });
    expect(store.saveCatalog(company())).toEqual({ ok: true, persistence: "memory" });
    expect(store.getSnapshot().organizations).toHaveLength(2);
    store.hydrate();
    store.saveCatalog(company("org_second"));
    expect(store.getSnapshot().organizations).toHaveLength(3);
  });
  it("resets only its own key and returns to Nimbus", () => {
    const adapter = storage();
    adapter.values.set("theme", "light");
    adapter.values.set("other.app", "untouched");
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    store.saveCatalog(company());
    expect(store.resetDemo()).toEqual({ ok: true, persistence: "local" });
    expect(adapter.removeItem).toHaveBeenCalledExactlyOnceWith(ORGANIZATION_STORAGE_KEY);
    expect(adapter.values.has(ORGANIZATION_STORAGE_KEY)).toBe(false);
    expect(adapter.values.get("theme")).toBe("light");
    expect(adapter.values.get("other.app")).toBe("untouched");
    expect(store.getSnapshot()).toMatchObject({ organizations: [nimbus], activeOrganizationId: builtInOrganizationId });
  });
  it("can reset memory even if removing persisted data is blocked", () => {
    const adapter = storage();
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    store.saveCatalog(company());
    adapter.removeItem.mockImplementation(() => { throw new Error("Blocked"); });
    expect(store.resetDemo()).toEqual({ ok: true, persistence: "memory" });
    expect(store.getSnapshot()).toMatchObject({ organizations: [nimbus], activeOrganizationId: builtInOrganizationId });
  });
  it("rejects invalid mutations but accepts a valid Nimbus update without modifying the seed", () => {
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => null });
    expect(store.saveCatalog({ ...company(), plans: [{}] })).toEqual({ ok: false, reason: "invalid-catalog" });
    const changed = structuredClone(nimbus);
    changed.plans[0].name = "Edited Free";
    expect(store.saveCatalog(changed)).toEqual({ ok: true, persistence: "memory" });
    expect(store.selectOrganization("missing")).toEqual({ ok: false, reason: "unknown-organization" });
    expect(store.getSnapshot().organizations).toEqual([changed]);
    expect(nimbus.plans[0].name).toBe("Free");
    store.resetDemo();
    expect(store.getSnapshot().organizations).toEqual([nimbus]);
  });
  it("notifies subscribed consumers and stops after unsubscription", () => {
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => null });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.hydrate();
    store.saveCatalog(company());
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.resetDemo();
    expect(listener).toHaveBeenCalledTimes(2);
  });
  it("keeps a recovery notice when navigation changes companies and skips redundant selection writes", () => {
    const adapter = storage();
    adapter.values.set(ORGANIZATION_STORAGE_KEY, payload([company(), {}]));
    const store = createOrganizationStore({ builtInOrganizationId, storage: () => adapter });
    store.hydrate();
    const initial = store.getSnapshot();
    store.selectOrganization("org_new");
    expect(store.getSnapshot()).toBe(initial);
    expect(adapter.setItem).not.toHaveBeenCalled();
    store.selectOrganization(builtInOrganizationId);
    expect(store.getSnapshot().recovery).toBe("partial-data");
  });
});
