import type { Catalog } from "@/lib/catalog";
import { isCatalog } from "@/lib/validate-catalog";

export const ORGANIZATION_STORAGE_KEY = "commet.demo.organizations";
export const ORGANIZATION_SCHEMA_VERSION = 1;

export type OrganizationSnapshot = {
  hydrated: boolean;
  organizations: readonly Catalog[];
  activeOrganizationId: string;
  persistence: "local" | "memory";
  recovery: "none" | "invalid-data" | "unsupported-version" | "partial-data";
};
type StorageAdapter = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type StoreOptions = { builtInOrganizationId: string; storage?: () => StorageAdapter | null };
type MutationResult = { ok: true; persistence: OrganizationSnapshot["persistence"] }
  | { ok: false; reason: "invalid-catalog" | "reserved-organization" | "unknown-organization" };

function browserStorage(): StorageAdapter | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

/** Freeze copied snapshots so callers cannot mutate the store without validation/notification. */
function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value !== null && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    for (const child of Object.values(value)) freeze(child, seen);
    Object.freeze(value);
  }
  return value;
}

/**
 * The persistence boundary. Call hydrate after mount, never during server rendering.
 * A blocked getter, read, write or reset downgrades this instance to an in-memory session.
 */
export function createOrganizationStore({ builtInOrganizationId, storage = browserStorage }: StoreOptions) {
  let adapter: StorageAdapter | null = null;
  let snapshot: OrganizationSnapshot = freeze({
    hydrated: false, organizations: [], activeOrganizationId: builtInOrganizationId,
    persistence: "memory", recovery: "none",
  });
  const listeners = new Set<() => void>();

  function notify(next: OrganizationSnapshot) {
    snapshot = freeze(next);
    listeners.forEach((listener) => listener());
  }

  function hydrate() {
    if (snapshot.hydrated) return;
    let organizations: Catalog[] = [];
    let activeOrganizationId = builtInOrganizationId;
    let recovery: OrganizationSnapshot["recovery"] = "none";
    let raw: string | null = null;
    try {
      adapter = storage();
      raw = adapter?.getItem(ORGANIZATION_STORAGE_KEY) ?? null;
    } catch { adapter = null; }
    if (raw !== null) {
      try {
        const payload: unknown = JSON.parse(raw);
        if (typeof payload !== "object" || payload === null || !("version" in payload)) {
          recovery = "invalid-data";
        } else if (payload.version !== ORGANIZATION_SCHEMA_VERSION) {
          recovery = "unsupported-version";
        } else if (!("organizations" in payload) || !Array.isArray(payload.organizations)
          || !("activeOrganizationId" in payload) || typeof payload.activeOrganizationId !== "string") {
          recovery = "invalid-data";
        } else {
          const ids = new Set([builtInOrganizationId]);
          for (const candidate of payload.organizations) {
            if (!isCatalog(candidate) || ids.has(candidate.organization.id)) { recovery = "partial-data"; continue; }
            ids.add(candidate.organization.id);
            organizations.push(candidate);
          }
          if (ids.has(payload.activeOrganizationId)) activeOrganizationId = payload.activeOrganizationId;
          else recovery = "partial-data";
        }
      } catch { recovery = "invalid-data"; }
    }
    notify({ hydrated: true, organizations, activeOrganizationId, recovery, persistence: adapter ? "local" : "memory" });
  }

  function write(next: OrganizationSnapshot, reset = false, recovery: OrganizationSnapshot["recovery"] = "none"): MutationResult {
    try {
      if (reset) adapter?.removeItem(ORGANIZATION_STORAGE_KEY);
      else adapter?.setItem(ORGANIZATION_STORAGE_KEY, JSON.stringify({
        version: ORGANIZATION_SCHEMA_VERSION,
        organizations: next.organizations,
        activeOrganizationId: next.activeOrganizationId,
      }));
    } catch { adapter = null; }
    notify({ ...next, persistence: adapter ? "local" : "memory", recovery });
    return { ok: true, persistence: snapshot.persistence };
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    hydrate,
    saveCatalog(catalog: unknown, activate = true): MutationResult {
      hydrate();
      if (!isCatalog(catalog)) return { ok: false, reason: "invalid-catalog" };
      if (catalog.organization.id === builtInOrganizationId) return { ok: false, reason: "reserved-organization" };
      let copy: Catalog;
      try { copy = structuredClone(catalog); }
      catch { return { ok: false, reason: "invalid-catalog" }; }
      const existing = snapshot.organizations.some((entry) => entry.organization.id === copy.organization.id);
      const organizations = existing ? snapshot.organizations.map((entry) => entry.organization.id === copy.organization.id ? copy : entry)
        : [...snapshot.organizations, copy];
      return write({ ...snapshot, organizations, activeOrganizationId: activate ? copy.organization.id : snapshot.activeOrganizationId });
    },
    selectOrganization(id: string): MutationResult {
      hydrate();
      if (id !== builtInOrganizationId && !snapshot.organizations.some((entry) => entry.organization.id === id)) {
        return { ok: false, reason: "unknown-organization" };
      }
      if (id === snapshot.activeOrganizationId) return { ok: true, persistence: snapshot.persistence };
      return write({ ...snapshot, activeOrganizationId: id }, false, snapshot.recovery);
    },
    resetDemo(): MutationResult {
      hydrate();
      return write({ ...snapshot, organizations: [], activeOrganizationId: builtInOrganizationId }, true);
    },
  };
}

export type OrganizationStore = ReturnType<typeof createOrganizationStore>;
