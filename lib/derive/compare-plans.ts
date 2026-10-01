import type { Catalog } from "@/lib/catalog";
import { areFeatureValuesEqual, compareFeatureValues, isFeatureAvailable } from "@/lib/derive/compare-features";
import { compareExhaustionPolicies } from "@/lib/derive/exhaustion-policy";
import { getPlanDetail, groupFeaturesByType, resolveViewedVersion } from "@/lib/derive/plan-detail";
import { getPlanLadder } from "@/lib/derive/plans";
import type { FeatureImpact, FeatureValue, PeriodPricing, PlanDetail, ResolvedFeature, TimelineEntry } from "@/lib/derive/types";

export type ComparisonFeatureRow = ResolvedFeature & {
  comparedValue: FeatureValue;
  differs: boolean;
  /** Equal values have no label; neutral on a changed value means a trade-off. */
  impact: FeatureImpact | null;
};

export type ComparisonTarget = { detail: PlanDetail; viewed: TimelineEntry; parameter: string; isSamePlan: boolean };
export type ComparisonOption = { code: string; name: string; isPublic: boolean; isSamePlan: boolean; defaultVersion: number; versions: { version: number; status: string; isCurrent: boolean }[] };
export type ComparisonQuery = { version: number; compare?: string; onlyDifferences?: boolean };

/** Individual amounts have direction; the complete plan still has no overall winner. */
export function numericComparisonImpact(delta: number | null, preference: "lower" | "higher"): FeatureImpact | null {
  if (delta === null || delta === 0) return null;
  return (preference === "lower" ? delta < 0 : delta > 0) ? "better" : "worse";
}

export function comparePeriodPricing(left: PeriodPricing | null, right: PeriodPricing | null) {
  if (!left || !right) return { availabilityDiffers: left !== right, priceDelta: null, creditsDelta: null, unitCostDelta: null };
  return {
    availabilityDiffers: false,
    priceDelta: right.price - left.price,
    creditsDelta: right.includedCredits - left.includedCredits,
    unitCostDelta: left.pricePerThousandCredits === null || right.pricePerThousandCredits === null ? null : right.pricePerThousandCredits - left.pricePerThousandCredits,
  };
}

export function comparePlanContext(left: PlanDetail, right: PlanDetail) {
  const policyImpact = compareExhaustionPolicies(left.plan.exhaustionPolicy, right.plan.exhaustionPolicy);
  return {
    customerDelta: right.plan.totalSubscriptions - left.plan.totalSubscriptions,
    policyDiffers: policyImpact !== null,
    policyImpact,
    packDiffers: left.packComparison?.cheapestPack.code !== right.packComparison?.cheapestPack.code,
  };
}

/** All transitions rebuild this small query, so comparison links never carry edit state. */
export function planComparisonHref(code: string, { version, compare, onlyDifferences }: ComparisonQuery): string {
  const query = new URLSearchParams({ version: String(version) });
  if (compare) {
    query.set("compare", compare);
    if (onlyDifferences) query.set("diff", "1");
  }
  return `/plans/${encodeURIComponent(code)}?${query}`;
}

/** Edit wins for a manually composed URL containing both modes. */
export function resolveComparisonTarget(catalog: Catalog, leftCode: string, requested: string | string[] | undefined, editRequested = false): ComparisonTarget | null {
  const raw = Array.isArray(requested) ? requested[0] : requested;
  if (!raw || editRequested) return null;
  const match = /^(.*)\.(\d+)$/.exec(raw);
  const code = match ? match[1] : raw;
  const detail = getPlanDetail(catalog, code);
  if (!detail) return null;
  const version = resolveViewedVersion(detail.timeline, match?.[2], detail.plan.currentReleaseVersion);
  const viewed = detail.timeline.find((entry) => entry.version === version);
  if (!viewed) return null;
  return { detail, viewed, parameter: `${code}.${version}`, isSamePlan: code === leftCode };
}

/** Other versions of this plan first, followed by the other plans in pricing order. */
export function getComparisonOptions(catalog: Catalog, leftCode: string, viewedVersion?: number): ComparisonOption[] {
  const options = getPlanLadder(catalog).map((plan) => {
    const detail = getPlanDetail(catalog, plan.code);
    const currentVersion = resolveViewedVersion(detail?.timeline ?? [], undefined, plan.currentReleaseVersion);
    const isSamePlan = plan.code === leftCode;
    const versions = [...(detail?.timeline ?? [])].reverse()
      .filter((entry) => !isSamePlan || entry.version !== (viewedVersion ?? currentVersion))
      .map((entry) => ({ version: entry.version, status: entry.status, isCurrent: entry.isCurrent }));
    return {
      code: plan.code, name: plan.name, isPublic: plan.isPublic, isSamePlan,
      defaultVersion: versions.find((entry) => entry.isCurrent)?.version ?? versions[0]?.version ?? currentVersion,
      versions,
    };
  }).filter((option) => option.versions.length > 0);
  return [...options.filter((option) => option.isSamePlan), ...options.filter((option) => !option.isSamePlan)];
}

/** Both releases are resolved against the same catalog, preserving its feature order. */
export function getComparedFeatureRows(left: TimelineEntry, right: TimelineEntry, onlyDifferences = false) {
  const rightByCode = new Map(right.features.map((entry) => [entry.feature.code, entry.value]));
  const rows: ComparisonFeatureRow[] = left.features.map((entry) => {
    const comparedValue = rightByCode.get(entry.feature.code) ?? { kind: "not_included" };
    // Absent and disabled both read as Not included, and are the same for customers.
    const bothUnavailable = !isFeatureAvailable(entry.value) && !isFeatureAvailable(comparedValue);
    const differs = !bothUnavailable && !areFeatureValuesEqual(entry.value, comparedValue);
    return { ...entry, comparedValue, differs, impact: differs ? compareFeatureValues(entry.value, comparedValue) : null };
  });
  return {
    groups: groupFeaturesByType(onlyDifferences ? rows.filter((row) => row.differs) : rows),
    total: rows.length,
    differences: rows.filter((row) => row.differs).length,
  };
}
