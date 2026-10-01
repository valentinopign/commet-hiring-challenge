import type { ExhaustionPolicy } from "@/lib/catalog";
import type { FeatureImpact } from "@/lib/derive/types";

/**
 * Customer impact of moving from one exhaustion policy to another; null when they are equal.
 * Blocking never bills extra but stops the service, billing overage keeps it running at a cost:
 * neither is better for every customer, so switching between them is a trade-off.
 */
export function compareExhaustionPolicies(before: ExhaustionPolicy, after: ExhaustionPolicy): FeatureImpact | null {
  if (before.type !== after.type) return "neutral";
  if (before.type === "bill_overage" && after.type === "bill_overage" && before.pricePer1000Credits !== after.pricePer1000Credits) {
    return after.pricePer1000Credits < before.pricePer1000Credits ? "better" : "worse";
  }
  return null;
}
