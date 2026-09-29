import type { Catalog, CatalogFeature, Plan, PlanRelease, ReleaseFeature } from "@/lib/catalog";
import {
  areFeatureValuesEqual,
  compareFeatureValues,
  isFeatureAvailable,
} from "@/lib/derive/compare-features";
import { getVersionSplit } from "@/lib/derive/subscriptions";
import type {
  FeatureChange,
  FeatureValue,
  ResolvedFeature,
  TimelineEntry,
} from "@/lib/derive/types";

/**
 * Every catalog feature, in catalog order, with its value in this release. Releases store
 * features in varying order and omit the ones they do not offer; this makes both explicit.
 * Release features whose code is not in the catalog are ignored: the catalog is the
 * definition of what a feature is.
 */
export function resolveReleaseFeatures(
  catalogFeatures: CatalogFeature[],
  releaseFeatures: ReleaseFeature[],
): ResolvedFeature[] {
  const byCode = new Map(releaseFeatures.map((feature) => [feature.code, feature]));
  return catalogFeatures.map((feature) => {
    const configured = byCode.get(feature.code);
    return {
      feature,
      value: configured ? toFeatureValue(configured) : { kind: "not_included" },
    };
  });
}

export function toFeatureValue(releaseFeature: ReleaseFeature): FeatureValue {
  switch (releaseFeature.type) {
    case "credit":
      return { kind: "credit", creditsPerUnit: releaseFeature.creditsPerUnit };
    case "capacity":
      return { kind: "capacity", limit: releaseFeature.limit };
    case "boolean":
      return { kind: "boolean", enabled: releaseFeature.enabled };
  }
}

/**
 * Changes from `before` to `after`, in `after`'s order. Both sides are expected to be
 * resolved against the same catalog. A feature that stays unavailable (absent, or a
 * boolean kept off) is not a change.
 */
export function diffFeatureSets(
  before: ResolvedFeature[],
  after: ResolvedFeature[],
): FeatureChange[] {
  const beforeByCode = new Map(before.map((entry) => [entry.feature.code, entry.value]));
  const changes: FeatureChange[] = [];

  for (const { feature, value: afterValue } of after) {
    const beforeValue: FeatureValue = beforeByCode.get(feature.code) ?? { kind: "not_included" };
    const wasAvailable = isFeatureAvailable(beforeValue);
    const isAvailable = isFeatureAvailable(afterValue);

    if (!wasAvailable && isAvailable) {
      changes.push({ feature, kind: "added", before: beforeValue, after: afterValue, impact: "better" });
    } else if (wasAvailable && !isAvailable) {
      changes.push({ feature, kind: "removed", before: beforeValue, after: afterValue, impact: "worse" });
    } else if (isAvailable && !areFeatureValuesEqual(beforeValue, afterValue)) {
      changes.push({
        feature,
        kind: "changed",
        before: beforeValue,
        after: afterValue,
        impact: compareFeatureValues(beforeValue, afterValue),
      });
    }
  }
  return changes;
}

export function getCurrentRelease(plan: Plan): PlanRelease | undefined {
  return plan.releases.find((release) => release.version === plan.currentReleaseVersion);
}

/** Oldest first. Each entry carries what changed since the version before it. */
export function getVersionTimeline(catalog: Catalog, plan: Plan): TimelineEntry[] {
  const releases = [...plan.releases].sort((first, second) => first.version - second.version);
  const sharesByVersion = new Map(
    getVersionSplit(catalog, plan).map((share) => [share.version, share]),
  );
  const resolved = releases.map((release) =>
    resolveReleaseFeatures(catalog.features, release.features),
  );

  return releases.flatMap((release, index) => {
    const share = sharesByVersion.get(release.version);
    if (!share) return [];
    const previousFeatures = index > 0 ? resolved[index - 1] : undefined;
    // A draft has not replaced anything yet, so it cannot close the previous version.
    const nextRelease = releases
      .slice(index + 1)
      .find((candidate) => candidate.status !== "building");
    return [
      {
        ...share,
        publishedAt: release.publishedAt,
        replacedAt: nextRelease ? nextRelease.publishedAt : null,
        features: resolved[index],
        changesFromPrevious: previousFeatures
          ? diffFeatureSets(previousFeatures, resolved[index])
          : null,
      },
    ];
  });
}
