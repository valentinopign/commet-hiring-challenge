import type { Catalog } from "@/lib/catalog";
import { getCatalogAlerts } from "@/lib/derive/alerts";
import { areFeatureValuesEqual } from "@/lib/derive/compare-features";
import { comparePacksWithOverage } from "@/lib/derive/credit-packs";
import { findPlanByCode, summarizePlan } from "@/lib/derive/plans";
import { getVersionTimeline } from "@/lib/derive/releases";
import type {
  FeatureRow,
  FeatureRowsByType,
  PlanDetail,
  ResolvedFeature,
  TimelineEntry,
} from "@/lib/derive/types";

/** Everything the plan page shows, or `null` when no plan has that code. */
export function getPlanDetail(catalog: Catalog, code: string): PlanDetail | null {
  const plan = findPlanByCode(catalog, code);
  if (!plan) return null;
  const summary = summarizePlan(catalog, plan);
  return {
    plan: summary,
    timeline: getVersionTimeline(catalog, plan),
    alerts: getCatalogAlerts(catalog).filter((alert) => alert.planCode === code),
    packComparison: comparePacksWithOverage(catalog, code, plan.exhaustionPolicy),
  };
}

/** Catalog order is kept inside each group. */
export function groupFeaturesByType<Feature extends ResolvedFeature>(
  features: Feature[],
): Record<"credit" | "capacity" | "boolean", Feature[]> {
  return {
    credit: features.filter((entry) => entry.feature.type === "credit"),
    capacity: features.filter((entry) => entry.feature.type === "capacity"),
    boolean: features.filter((entry) => entry.feature.type === "boolean"),
  };
}

/**
 * The version a `?version=` value points to. Anything that is not a version of this plan
 * (missing, malformed like "v2", or a version that does not exist) falls back to the current version, so a
 * stale or edited link still shows something sensible instead of an error.
 */
export function resolveViewedVersion(
  timeline: TimelineEntry[],
  requested: string | string[] | undefined,
  currentVersion: number,
): number {
  const raw = Array.isArray(requested) ? requested[0] : requested;
  const parsed = raw !== undefined && /^\d+$/.test(raw) ? Number(raw) : null;
  const exists = (version: number) => timeline.some((entry) => entry.version === version);
  if (parsed !== null && exists(parsed)) return parsed;
  if (exists(currentVersion)) return currentVersion;
  // A plan whose current version is missing (reported as an alert) still shows its newest one.
  return timeline.at(-1)?.version ?? currentVersion;
}

/**
 * The features of the viewed version, each paired with the current version's value, grouped
 * by type. Lets a retired version be read against what new customers get today.
 */
export function getFeatureRows(viewed: TimelineEntry, current: TimelineEntry | undefined): FeatureRowsByType {
  const currentByCode = new Map(
    (current?.features ?? []).map((entry) => [entry.feature.code, entry.value]),
  );
  const rows: FeatureRow[] = viewed.features.map((entry) => {
    const currentValue = currentByCode.get(entry.feature.code) ?? entry.value;
    return {
      ...entry,
      currentValue,
      differsFromCurrent: !areFeatureValuesEqual(entry.value, currentValue),
    };
  });
  return groupFeaturesByType(rows);
}

