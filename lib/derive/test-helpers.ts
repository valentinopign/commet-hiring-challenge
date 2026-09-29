import type { Catalog, Plan, PlanRelease } from "@/lib/catalog";
import { catalog } from "@/data/catalog";

/** Shared by the test files only. Throws instead of returning undefined so tests fail loudly. */
export function getPlan(code: string, source: Catalog = catalog): Plan {
  const plan = source.plans.find((candidate) => candidate.code === code);
  if (!plan) throw new Error(`Plan "${code}" not found in test catalog`);
  return plan;
}

export function getRelease(code: string, version: number, source: Catalog = catalog): PlanRelease {
  const release = getPlan(code, source).releases.find((candidate) => candidate.version === version);
  if (!release) throw new Error(`Release ${code} v${version} not found in test catalog`);
  return release;
}

/** A deep copy, so a test can bend the data into an edge case without touching the source. */
export function cloneCatalog(): Catalog {
  return structuredClone(catalog);
}
