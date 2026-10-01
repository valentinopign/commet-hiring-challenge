import type { Catalog } from "@/lib/catalog";
import { isCatalog } from "@/lib/validate-catalog";
import { isScheduledMigration, publishPlanEdit, type ScheduledMigration, type EditPublicationRequest, type PublicationResult } from "@/lib/edit-plan/publication";
import { nimbusSeed, NIMBUS_SEED_VERSION } from "@/lib/nimbus-seed";

export const ORGANIZATION_STORAGE_KEY = "commet.demo.organizations";
export const ORGANIZATION_SCHEMA_VERSION = 2;

export type OrganizationSnapshot = {
  hydrated: boolean;
  organizations: readonly Catalog[];
  scheduledMigrations: readonly ScheduledMigration[];
  activeOrganizationId: string;
  persistence: "local" | "memory";
  recovery: "none" | "invalid-data" | "unsupported-version" | "partial-data" | "seed-changed";
};
type StorageAdapter = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type StoreOptions = { builtInOrganizationId: string; seedCatalog?: Catalog; seedVersion?: number; storage?: () => StorageAdapter | null };
type MutationResult = { ok: true; persistence: OrganizationSnapshot["persistence"] }
  | { ok: false; reason: "invalid-catalog" | "unknown-organization" };

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
export function createOrganizationStore({ builtInOrganizationId, seedCatalog = nimbusSeed, seedVersion = NIMBUS_SEED_VERSION, storage = browserStorage }: StoreOptions) {
  if (!isCatalog(seedCatalog) || seedCatalog.organization.id !== builtInOrganizationId || !Number.isSafeInteger(seedVersion) || seedVersion < 1) {
    throw new Error("A valid built-in catalog and positive seed version are required.");
  }
  const seed = freeze(structuredClone(seedCatalog));
  let adapter: StorageAdapter | null = null;
  let snapshot: OrganizationSnapshot = freeze({
    hydrated: false, organizations: [seed], scheduledMigrations: [], activeOrganizationId: builtInOrganizationId,
    persistence: "memory", recovery: "none",
  });
  const listeners = new Set<() => void>();

  function notify(next: OrganizationSnapshot) {
    snapshot = freeze(next);
    listeners.forEach((listener) => listener());
  }

  function hydrate() {
    if (snapshot.hydrated) return;
    const organizations: Catalog[] = [seed];
    const scheduledMigrations: ScheduledMigration[] = [];
    let activeOrganizationId = builtInOrganizationId;
    let recovery: OrganizationSnapshot["recovery"] = "none";
    let raw: string | null = null;
    let repairEnvelope = false;
    const markPartial = () => { if (recovery === "none") recovery = "partial-data"; };
    try {
      adapter = storage();
      raw = adapter?.getItem(ORGANIZATION_STORAGE_KEY) ?? null;
    } catch { adapter = null; }
    if (raw !== null) {
      try {
        const payload: unknown = JSON.parse(raw);
        if (typeof payload !== "object" || payload === null || !("version" in payload)) {
          recovery = "invalid-data";
        } else if (payload.version !== 1 && payload.version !== ORGANIZATION_SCHEMA_VERSION) {
          recovery = "unsupported-version";
        } else if (!("organizations" in payload) || !Array.isArray(payload.organizations)
          || !("activeOrganizationId" in payload) || typeof payload.activeOrganizationId !== "string") {
          recovery = "invalid-data";
        } else {
          const legacy = payload.version === 1;
          const seedMatches = !legacy && "seedVersion" in payload && payload.seedVersion === seedVersion;
          repairEnvelope = legacy || !seedMatches;
          if (!legacy && !seedMatches) recovery = "seed-changed";
          let seenNimbus = false;
          let loadedNimbus = false;
          const ids = new Set([builtInOrganizationId]);
          for (const candidate of payload.organizations) {
            if (!isCatalog(candidate)) { markPartial(); continue; }
            if (candidate.organization.id === builtInOrganizationId) {
              if (legacy || seenNimbus) { markPartial(); continue; }
              seenNimbus = true;
              if (seedMatches) { organizations[0] = candidate; loadedNimbus = true; }
              continue;
            }
            if (ids.has(candidate.organization.id)) { markPartial(); continue; }
            ids.add(candidate.organization.id);
            organizations.push(candidate);
          }
          if (!legacy && seedMatches && !seenNimbus) markPartial();
          if (ids.has(payload.activeOrganizationId)) activeOrganizationId = payload.activeOrganizationId;
          else markPartial();
          if ("scheduledMigrations" in payload) {
            if (!Array.isArray(payload.scheduledMigrations)) markPartial();
            else for (const candidate of payload.scheduledMigrations) {
              // Seed recovery clears Nimbus operations, never pending moves for valid local companies.
              if (!loadedNimbus && typeof candidate === "object" && candidate !== null && "organizationId" in candidate && candidate.organizationId === builtInOrganizationId) {
                if (recovery !== "seed-changed") markPartial();
                continue;
              }
              if (!isScheduledMigration(candidate, organizations) || scheduledMigrations.some((item) => item.organizationId === candidate.organizationId && item.planCode === candidate.planCode && item.fromVersion === candidate.fromVersion)) {
                markPartial();
                continue;
              }
              scheduledMigrations.push(candidate);
            }
          }
        }
      } catch { recovery = "invalid-data"; }
    }
    const next: OrganizationSnapshot = { hydrated: true, organizations, scheduledMigrations, activeOrganizationId, recovery, persistence: adapter ? "local" : "memory" };
    if (raw === null || repairEnvelope) write(next, false, recovery);
    else notify(next);
  }

  function write(next: OrganizationSnapshot, reset = false, recovery: OrganizationSnapshot["recovery"] = "none"): MutationResult {
    try {
      if (reset) adapter?.removeItem(ORGANIZATION_STORAGE_KEY);
      else adapter?.setItem(ORGANIZATION_STORAGE_KEY, JSON.stringify({
        version: ORGANIZATION_SCHEMA_VERSION,
        seedVersion,
        organizations: next.organizations,
        scheduledMigrations: next.scheduledMigrations,
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
    publishEdit(organizationId: string, request: EditPublicationRequest): PublicationResult {
      hydrate();
      const latest = snapshot.organizations.find((entry) => entry.organization.id === organizationId);
      if (!latest) return { ok: false, reason: "unknown-organization" };
      const result = publishPlanEdit(latest, snapshot.scheduledMigrations, request);
      if (!result.ok) return result;
      write({ ...snapshot, organizations: snapshot.organizations.map((entry) => entry.organization.id === organizationId ? result.publication.catalog : entry), scheduledMigrations: result.publication.schedules });
      return { ...result, persistence: snapshot.persistence };
    },
    saveCatalog(catalog: unknown, activate = true): MutationResult {
      hydrate();
      if (!isCatalog(catalog)) return { ok: false, reason: "invalid-catalog" };
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
      return write({ ...snapshot, organizations: [seed], scheduledMigrations: [], activeOrganizationId: builtInOrganizationId }, true);
    },
  };
}

export type OrganizationStore = ReturnType<typeof createOrganizationStore>;
