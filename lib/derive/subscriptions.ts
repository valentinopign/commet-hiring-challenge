import type { Catalog, Plan } from "@/lib/catalog";
import type { CatalogTotals, VersionShare } from "@/lib/derive/types";

/** A release with no subscription row simply has no customers. */
export function getReleaseSubscriptions(
  catalog: Catalog,
  planCode: string,
  version: number,
): number {
  return catalog.subscriptionsByRelease
    .filter((row) => row.planCode === planCode && row.version === version)
    .reduce((total, row) => total + row.subscriptions, 0);
}

export function getVersionSplit(catalog: Catalog, plan: Plan): VersionShare[] {
  const releases = [...plan.releases].sort((first, second) => first.version - second.version);
  const counts = releases.map((release) =>
    getReleaseSubscriptions(catalog, plan.code, release.version),
  );
  const total = sum(counts);
  const percents = toWholePercentages(counts);

  return releases.map((release, index) => ({
    version: release.version,
    status: release.status,
    subscriptions: counts[index],
    share: total > 0 ? counts[index] / total : 0,
    percent: percents[index],
    isCurrent: release.version === plan.currentReleaseVersion,
  }));
}

export function getPlanSubscriptions(catalog: Catalog, plan: Plan): number {
  return sum(
    plan.releases.map((release) => getReleaseSubscriptions(catalog, plan.code, release.version)),
  );
}

/**
 * Only rows that join to an existing release are counted. Rows pointing at a missing
 * release are surfaced as an alert instead of being silently added to a total.
 */
export function getCatalogTotals(catalog: Catalog): CatalogTotals {
  let totalCustomers = 0;
  let customersOnRetiredVersions = 0;
  let paidCustomers = 0;

  for (const plan of catalog.plans) {
    for (const release of plan.releases) {
      const subscriptions = getReleaseSubscriptions(catalog, plan.code, release.version);
      totalCustomers += subscriptions;
      if (release.status === "retired") customersOnRetiredVersions += subscriptions;
      if (isPaidPlan(plan)) paidCustomers += subscriptions;
    }
  }

  return { totalCustomers, customersOnRetiredVersions, paidCustomers };
}

/** A plan is paid by its pricing type, not its price, so a paid plan without a monthly price still counts. */
export function isPaidPlan(plan: Plan): boolean {
  return plan.pricing.type !== "free";
}

/**
 * Rounds each count's share to a whole percentage while keeping the sum at exactly 100
 * (largest remainder method), so a split bar never reads 99% or 101%.
 * Returns all zeros when there is nothing to split.
 */
export function toWholePercentages(counts: number[]): number[] {
  const total = sum(counts);
  if (total === 0) return counts.map(() => 0);

  const exact = counts.map((count) => (count / total) * 100);
  const rounded = exact.map(Math.floor);
  let remaining = 100 - sum(rounded);

  const byLargestRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((first, second) => second.remainder - first.remainder);

  for (const { index } of byLargestRemainder) {
    if (remaining <= 0) break;
    rounded[index] += 1;
    remaining -= 1;
  }
  return rounded;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
