import type {
  BillingInterval,
  Catalog,
  CreditPack,
  Plan,
  PlanPricing,
} from "@/lib/catalog";
import { getCurrentRelease, resolveReleaseFeatures } from "@/lib/derive/releases";
import { getPlanSubscriptions, getVersionSplit } from "@/lib/derive/subscriptions";
import type { DraftPlan, DraftSummary, PeriodPricing, PlanSummary } from "@/lib/derive/types";

export function findPlanByCode(catalog: Catalog, code: string): Plan | undefined {
  return catalog.plans.find((plan) => plan.code === code);
}

/** `null` when there are no credits to divide by. Result is in (possibly fractional) cents. */
export function getPricePerThousandCredits(priceInCents: number, credits: number): number | null {
  if (credits <= 0) return null;
  // Multiplying first keeps whole results exact (9900 / 12500 × 1000 would drift to 792.0000000000001).
  return (priceInCents * 1000) / credits;
}

/**
 * Free pricing has no interval; its credits are treated as monthly (see DECISIONS.md),
 * so a free plan has a monthly period at $0 and no yearly period.
 * Monthly and yearly are read independently: one is never derived from the other.
 */
export function getPeriodPricing(
  pricing: PlanPricing,
  interval: BillingInterval,
): PeriodPricing | null {
  if (pricing.type === "free") {
    if (interval !== "monthly") return null;
    return {
      interval,
      price: 0,
      includedCredits: pricing.includedCredits,
      pricePerThousandCredits: getPricePerThousandCredits(0, pricing.includedCredits),
    };
  }

  const matching = pricing.prices.filter((price) => price.billingInterval === interval);
  const chosen = matching.find((price) => price.isDefault) ?? matching[0];
  if (!chosen) return null;
  return {
    interval,
    price: chosen.price,
    includedCredits: chosen.includedCredits,
    pricePerThousandCredits: getPricePerThousandCredits(chosen.price, chosen.includedCredits),
  };
}

export function summarizePlan(catalog: Catalog, plan: Plan): PlanSummary {
  const currentRelease = getCurrentRelease(plan);
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description,
    isPublic: plan.isPublic,
    isDefault: plan.isDefault,
    monthly: getPeriodPricing(plan.pricing, "monthly"),
    yearly: getPeriodPricing(plan.pricing, "yearly"),
    exhaustionPolicy: plan.exhaustionPolicy,
    currentReleaseVersion: plan.currentReleaseVersion,
    // A missing current release resolves to "nothing included"; the mismatch itself is
    // reported by the catalog alerts rather than guessed around here.
    currentFeatures: resolveReleaseFeatures(catalog.features, currentRelease?.features ?? []),
    totalSubscriptions: getPlanSubscriptions(catalog, plan),
    versionSplit: getVersionSplit(catalog, plan),
  };
}

export function summarizeDraft(catalog: Catalog, draft: DraftPlan): DraftSummary {
  return {
    code: draft.code,
    name: draft.name,
    isPublic: draft.isPublic,
    monthly: getPeriodPricing(draft.pricing, "monthly"),
    yearly: getPeriodPricing(draft.pricing, "yearly"),
    exhaustionPolicy: draft.exhaustionPolicy,
    features: resolveReleaseFeatures(catalog.features, draft.features),
  };
}

/** Cheapest monthly price first; plans without a monthly price go last, then by name. */
export function getPlanLadder(catalog: Catalog): PlanSummary[] {
  return catalog.plans
    .map((plan) => summarizePlan(catalog, plan))
    .sort(compareByMonthlyPrice);
}

export function compareByMonthlyPrice(
  first: { name: string; monthly: PeriodPricing | null },
  second: { name: string; monthly: PeriodPricing | null },
): number {
  if (first.monthly && second.monthly && first.monthly.price !== second.monthly.price) {
    return first.monthly.price - second.monthly.price;
  }
  if (first.monthly && !second.monthly) return -1;
  if (!first.monthly && second.monthly) return 1;
  return first.name.localeCompare(second.name);
}

export function getCreditPacksForPlan(catalog: Catalog, planCode: string): CreditPack[] {
  return catalog.creditPacks.filter((pack) => pack.planCodes.includes(planCode));
}

/** Code → display name, for places that only hold a plan code (alerts, credit packs). */
export function getPlanNames(catalog: Catalog): Map<string, string> {
  return new Map(catalog.plans.map((plan) => [plan.code, plan.name]));
}
