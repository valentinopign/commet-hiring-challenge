import type { CapacityLimit, Overage } from "@/lib/catalog";
import type { FeatureImpact, FeatureValue } from "@/lib/derive/types";

/** A boolean set to `false` is as unavailable as a feature missing from the release. */
export function isFeatureAvailable(value: FeatureValue): boolean {
  switch (value.kind) {
    case "not_included":
      return false;
    case "boolean":
      return value.enabled;
    case "credit":
    case "capacity":
      return true;
  }
}

export function areFeatureValuesEqual(first: FeatureValue, second: FeatureValue): boolean {
  if (first.kind === "credit" && second.kind === "credit") {
    return first.creditsPerUnit === second.creditsPerUnit;
  }
  if (first.kind === "capacity" && second.kind === "capacity") {
    return areCapacityLimitsEqual(first.limit, second.limit);
  }
  if (first.kind === "boolean" && second.kind === "boolean") {
    return first.enabled === second.enabled;
  }
  return first.kind === second.kind;
}

/**
 * Whether moving from `before` to `after` is better, worse or neutral for the customer.
 * The diff between versions and the draft's sanity checks both rely on this single rule set,
 * so "better" means the same thing everywhere in the dashboard.
 */
export function compareFeatureValues(before: FeatureValue, after: FeatureValue): FeatureImpact {
  const wasAvailable = isFeatureAvailable(before);
  const isAvailable = isFeatureAvailable(after);

  if (!wasAvailable && !isAvailable) return "neutral";
  if (!wasAvailable) return "better";
  if (!isAvailable) return "worse";

  if (before.kind === "credit" && after.kind === "credit") {
    return compareLowerIsBetter(before.creditsPerUnit, after.creditsPerUnit);
  }
  if (before.kind === "capacity" && after.kind === "capacity") {
    return compareCapacityLimits(before.limit, after.limit);
  }
  // Two enabled booleans, or kinds that cannot be compared: nothing changed for the customer.
  return "neutral";
}

function compareCapacityLimits(before: CapacityLimit, after: CapacityLimit): FeatureImpact {
  if (before.type === "unlimited" && after.type === "unlimited") return "neutral";
  if (before.type === "unlimited") return "worse";
  if (after.type === "unlimited") return "better";

  const amountImpact = compareHigherIsBetter(before.includedAmount, after.includedAmount);
  const overageImpact = compareOverages(before.overage, after.overage);

  if (amountImpact === "neutral") return overageImpact;
  if (overageImpact === "neutral") return amountImpact;
  if (amountImpact === overageImpact) return amountImpact;
  // More included units but a harsher overage (or the reverse) has no objective winner;
  // calling it better or worse would hide the trade-off, so it is reported as neutral.
  return "neutral";
}

function compareOverages(before: Overage, after: Overage): FeatureImpact {
  if (before.type === "blocked" && after.type === "blocked") return "neutral";
  // Being cut off is worse than paying for extra units: the customer loses the choice.
  if (before.type === "blocked") return "better";
  if (after.type === "blocked") return "worse";
  return compareLowerIsBetter(before.unitPrice, after.unitPrice);
}

function compareLowerIsBetter(before: number, after: number): FeatureImpact {
  if (after < before) return "better";
  if (after > before) return "worse";
  return "neutral";
}

function compareHigherIsBetter(before: number, after: number): FeatureImpact {
  return compareLowerIsBetter(after, before);
}

function areCapacityLimitsEqual(first: CapacityLimit, second: CapacityLimit): boolean {
  if (first.type === "unlimited" || second.type === "unlimited") {
    return first.type === second.type;
  }
  return (
    first.includedAmount === second.includedAmount &&
    areOveragesEqual(first.overage, second.overage)
  );
}

function areOveragesEqual(first: Overage, second: Overage): boolean {
  if (first.type === "billed" && second.type === "billed") {
    return first.unitPrice === second.unitPrice;
  }
  return first.type === second.type;
}
