import type { BillingInterval, Catalog, Plan, PlanPrice, PlanPricing } from "@/lib/catalog";
import { compareFeatureValues } from "@/lib/derive/compare-features";
import { findNeighbourPlans } from "@/lib/derive/neighbours";
import { getPeriodPricing, getPlanLadder } from "@/lib/derive/plans";
import { getCurrentRelease } from "@/lib/derive/releases";
import type {
  CreditPackSummary,
  DraftBase,
  FeatureImpact,
  FeatureValue,
  ResolvedFeature,
  DraftWarning,
  DraftWarningsBySeverity,
  NeighbourPlans,
  PlanSummary,
} from "@/lib/derive/types";

const BILLING_INTERVALS: BillingInterval[] = ["monthly", "yearly"];

/**
 * A suggested code for a name: "Growth Plus" → "growth_plus". Accents are dropped and anything
 * that is not a letter or digit becomes a single underscore; a leading digit is dropped because
 * codes start with a letter. The result can still be empty, which the position step reports.
 */
export function codeFromName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .replace(/_+$/, "");
}

/**
 * A draft keeps one price per interval: the one the plan offers by default. Ids are replaced
 * because a price id belongs to the plan that owns it.
 */
function copyPricing(pricing: PlanPricing): PlanPricing {
  if (pricing.type === "free") return { ...pricing };
  const prices = BILLING_INTERVALS.flatMap((interval): PlanPrice[] => {
    const matching = pricing.prices.filter((price) => price.billingInterval === interval);
    const chosen = matching.find((price) => price.isDefault) ?? matching[0];
    return chosen ? [{ ...chosen, id: `draft_${interval}`, isDefault: interval === "monthly" }] : [];
  });
  const [first, ...rest] = prices;
  // Unreachable with a valid plan (a standard pricing has at least one price), kept for the types.
  if (!first) return { type: "free", includedCredits: 0 };
  return { type: "standard", prices: [first, ...rest] };
}

export function draftBaseFromPlan(plan: Plan): DraftBase {
  return {
    code: plan.code,
    name: plan.name,
    currentReleaseVersion: plan.currentReleaseVersion,
    monthly: getPeriodPricing(plan.pricing, "monthly"),
    pricing: copyPricing(plan.pricing),
    exhaustionPolicy: { ...plan.exhaustionPolicy },
    // A missing current release copies no features; the catalog alerts already report it.
    features: structuredClone(getCurrentRelease(plan)?.features ?? []),
  };
}

/** Every plan a new one can start from, cheapest first like the ladder. */
export function getDraftBases(catalog: Catalog): DraftBase[] {
  const plansByCode = new Map(catalog.plans.map((plan) => [plan.code, plan]));
  return getPlanLadder(catalog).flatMap((summary) => {
    const plan = plansByCode.get(summary.code);
    return plan ? [draftBaseFromPlan(plan)] : [];
  });
}

/** The `?from=` value, only when it names a plan that exists; anything else starts from scratch. */
export function resolveBasePlanCode(
  requested: string | string[] | undefined,
  bases: DraftBase[],
): string | null {
  if (typeof requested !== "string") return null;
  return bases.some((base) => base.code === requested) ? requested : null;
}

export type YearlyReference = { priceMultiplier: number; creditsMultiplier: number };

/**
 * How the existing paid plans relate yearly to monthly (today: 10× the price, 12× the credits).
 * Only offered when every such plan follows the same ratio: a mixed catalog has no single
 * convention to suggest. `null` also covers a catalog without paid plans.
 */
export function getYearlyReference(ladder: PlanSummary[]): YearlyReference | null {
  const ratios = ladder.flatMap((plan) => {
    const { monthly, yearly } = plan;
    if (!monthly || !yearly || monthly.price === 0 || monthly.includedCredits === 0) return [];
    return [{ price: yearly.price / monthly.price, credits: yearly.includedCredits / monthly.includedCredits }];
  });
  const [first] = ratios;
  if (!first) return null;
  const isShared = ratios.every(
    (ratio) => Math.abs(ratio.price - first.price) < 0.001 && Math.abs(ratio.credits - first.credits) < 0.001,
  );
  return isShared ? { priceMultiplier: first.price, creditsMultiplier: first.credits } : null;
}

/**
 * Where the draft sits on the ladder. `null` until it has a monthly price: without one there is
 * no place to show, and pretending it sits at $0 would put it next to the free plan.
 */
export function getDraftPosition(
  ladder: PlanSummary[],
  monthlyPrice: number | null,
  excludeCode?: string,
): NeighbourPlans | null {
  if (monthlyPrice === null) return null;
  return findNeighbourPlans(ladder, monthlyPrice, excludeCode);
}

/** Keeps the order `checkDraftPlan` returns within each group. */
export function groupWarningsBySeverity(warnings: DraftWarning[]): DraftWarningsBySeverity {
  return {
    blocking: warnings.filter((warning) => warning.severity === "blocking"),
    warning: warnings.filter((warning) => warning.severity === "warning"),
    info: warnings.filter((warning) => warning.severity === "info"),
  };
}

/**
 * The yearly values the shared ratio suggests for a monthly price and credits. Only a suggestion
 * the person applies by hand: yearly pricing is never derived on its own.
 */
export function suggestYearly(
  reference: YearlyReference,
  monthlyPrice: number,
  monthlyCredits: number,
): { price: number; includedCredits: number } {
  return {
    price: Math.round(monthlyPrice * reference.priceMultiplier),
    includedCredits: Math.round(monthlyCredits * reference.creditsMultiplier),
  };
}

/** Cheapest and dearest price per 1,000 credits across the packs, for a reference line. */
export function getPackPriceRange(packs: CreditPackSummary[]): { min: number; max: number } | null {
  const prices = packs.flatMap((pack) => (pack.pricePerThousandCredits === null ? [] : [pack.pricePerThousandCredits]));
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export type NeighbourFeature = {
  planCode: string;
  planName: string;
  value: FeatureValue;
  /** How the draft's value compares with this plan's, from the customer's side. */
  draftImpact: FeatureImpact;
};

export type FeatureComparison = { below: NeighbourFeature | null; above: NeighbourFeature | null };

function neighbourFeature(plan: PlanSummary | null, code: string, draftValue: FeatureValue): NeighbourFeature | null {
  const value = plan?.currentFeatures.find((entry) => entry.feature.code === code)?.value;
  if (!plan || !value) return null;
  return { planCode: plan.code, planName: plan.name, value, draftImpact: compareFeatureValues(value, draftValue) };
}

/**
 * Each draft feature next to the same feature on the plans around it (their current version).
 * A `worse` impact against the cheaper plan, or a `better` one against the pricier plan, is what
 * the features step flags, with the same rule `checkDraftPlan` uses in the review.
 */
export function getFeatureComparisons(
  draftFeatures: ResolvedFeature[],
  position: NeighbourPlans | null,
): Record<string, FeatureComparison> {
  return Object.fromEntries(
    draftFeatures.map(({ feature, value }) => [
      feature.code,
      {
        below: neighbourFeature(position?.below ?? null, feature.code, value),
        above: neighbourFeature(position?.above ?? null, feature.code, value),
      },
    ]),
  );
}
