import type { Catalog } from "@/lib/catalog";
import { compareFeatureValues } from "@/lib/derive/compare-features";
import { findNeighbourPlans } from "@/lib/derive/neighbours";
import { getPlanLadder, summarizeDraft } from "@/lib/derive/plans";
import type {
  DraftPlan,
  DraftSummary,
  DraftWarning,
  DraftWarningSeverity,
  PlanSummary,
} from "@/lib/derive/types";

/** Same shape as the existing codes (`free`, `growth`): lowercase snake_case. */
export const PLAN_CODE_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

const MONTHS_PER_YEAR = 12;

const SEVERITY_ORDER: Record<DraftWarningSeverity, number> = { blocking: 0, warning: 1, info: 2 };

/**
 * Everything about the draft that looks wrong on its own or next to its neighbours on the
 * ladder, most severe first. Only `blocking` warnings should stop a publish.
 */
export function checkDraftPlan(draft: DraftPlan, catalog: Catalog): DraftWarning[] {
  const summary = summarizeDraft(catalog, draft);
  const ladder = getPlanLadder(catalog);

  const warnings: DraftWarning[] = [
    ...checkCode(draft, catalog),
    ...checkCreditsAndPolicy(draft, summary),
    ...checkYearlyAgainstMonthly(summary),
    ...checkAgainstNeighbours(summary, ladder),
  ];

  return warnings.sort(
    (first, second) => SEVERITY_ORDER[first.severity] - SEVERITY_ORDER[second.severity],
  );
}

function checkCode(draft: DraftPlan, catalog: Catalog): DraftWarning[] {
  if (!PLAN_CODE_PATTERN.test(draft.code)) {
    return [{ type: "code_invalid", severity: "blocking", code: draft.code }];
  }
  if (catalog.plans.some((plan) => plan.code === draft.code)) {
    return [{ type: "code_taken", severity: "blocking", code: draft.code }];
  }
  return [];
}

function checkCreditsAndPolicy(draft: DraftPlan, summary: DraftSummary): DraftWarning[] {
  const warnings: DraftWarning[] = [];
  const { monthly, yearly, exhaustionPolicy } = summary;

  if (monthly?.includedCredits === 0 || yearly?.includedCredits === 0) {
    warnings.push({ type: "no_included_credits", severity: "warning" });
  }

  if (exhaustionPolicy.type === "bill_overage") {
    if (draft.pricing.type === "free") {
      warnings.push({ type: "free_plan_bills_overage", severity: "warning" });
    }
    const includedPricePerThousand = monthly?.pricePerThousandCredits ?? null;
    if (
      includedPricePerThousand !== null &&
      exhaustionPolicy.pricePer1000Credits < includedPricePerThousand
    ) {
      warnings.push({
        type: "overage_cheaper_than_included",
        severity: "warning",
        overagePricePerThousand: exhaustionPolicy.pricePer1000Credits,
        includedPricePerThousand,
      });
    }
  } else if (draft.creditPackCodes.length === 0) {
    // Blocked with no pack to buy: upgrading is the customer's only way to keep going.
    warnings.push({ type: "blocked_without_credit_packs", severity: "info" });
  }

  return warnings;
}

function checkYearlyAgainstMonthly(summary: DraftSummary): DraftWarning[] {
  const { monthly, yearly } = summary;
  if (!monthly || !yearly) return [];

  const warnings: DraftWarning[] = [];
  const twelveMonthsPrice = monthly.price * MONTHS_PER_YEAR;
  const twelveMonthsCredits = monthly.includedCredits * MONTHS_PER_YEAR;

  if (yearly.price > twelveMonthsPrice) {
    warnings.push({
      type: "yearly_more_expensive_than_monthly",
      severity: "warning",
      yearlyPrice: yearly.price,
      twelveMonthsPrice,
    });
  }
  if (yearly.includedCredits < twelveMonthsCredits) {
    warnings.push({
      type: "yearly_fewer_credits_than_monthly",
      severity: "warning",
      yearlyCredits: yearly.includedCredits,
      twelveMonthsCredits,
    });
  }
  return warnings;
}

function checkAgainstNeighbours(summary: DraftSummary, ladder: PlanSummary[]): DraftWarning[] {
  const { monthly } = summary;
  if (!monthly) return [];

  const warnings: DraftWarning[] = [];

  const samePrice = ladder.find((plan) => plan.monthly?.price === monthly.price);
  if (samePrice) {
    warnings.push({
      type: "same_price_as_existing_plan",
      severity: "warning",
      planCode: samePrice.code,
      price: monthly.price,
    });
  }

  const { below, above } = findNeighbourPlans(ladder, monthly.price);
  // Equal-price plans sit below the draft on the ladder, so "cheaper" may mean "same price".
  const neighbourCostsSame = below?.monthly?.price === monthly.price;
  // Free credits have no price, so a free draft has no credit price to compare with anyone.
  const draftPerThousand = monthly.price > 0 ? monthly.pricePerThousandCredits : null;

  // A free plan's credits cost nothing, so any paid draft would trivially be "more expensive".
  const belowPerThousand = below?.monthly && below.monthly.price > 0
    ? below.monthly.pricePerThousandCredits
    : null;
  if (below && draftPerThousand !== null && belowPerThousand !== null && draftPerThousand > belowPerThousand) {
    warnings.push({
      type: "price_per_thousand_above_cheaper_plan",
      severity: "warning",
      planCode: below.code,
      draftValue: draftPerThousand,
      neighbourValue: belowPerThousand,
      neighbourCostsSame,
    });
  }

  const abovePerThousand = above?.monthly?.pricePerThousandCredits ?? null;
  if (above && draftPerThousand !== null && abovePerThousand !== null && draftPerThousand < abovePerThousand) {
    warnings.push({
      type: "price_per_thousand_below_pricier_plan",
      severity: "warning",
      planCode: above.code,
      draftValue: draftPerThousand,
      neighbourValue: abovePerThousand,
    });
  }

  if (
    below &&
    summary.exhaustionPolicy.type === "bill_overage" &&
    below.exhaustionPolicy.type === "bill_overage" &&
    summary.exhaustionPolicy.pricePer1000Credits > below.exhaustionPolicy.pricePer1000Credits
  ) {
    warnings.push({
      type: "overage_above_cheaper_plan",
      severity: "info",
      planCode: below.code,
      draftValue: summary.exhaustionPolicy.pricePer1000Credits,
      neighbourValue: below.exhaustionPolicy.pricePer1000Credits,
      neighbourCostsSame,
    });
  }

  if (below) warnings.push(...compareFeaturesWithCheaperPlan(summary, below, neighbourCostsSame));
  if (above) warnings.push(...compareFeaturesWithPricierPlan(summary, above));

  return warnings;
}

/** Paying more should never get the customer less of something. */
function compareFeaturesWithCheaperPlan(summary: DraftSummary, below: PlanSummary, neighbourCostsSame: boolean): DraftWarning[] {
  const belowByCode = new Map(below.currentFeatures.map((entry) => [entry.feature.code, entry.value]));
  return summary.features.flatMap(({ feature, value: draftValue }) => {
    const neighbourValue = belowByCode.get(feature.code);
    if (!neighbourValue || compareFeatureValues(neighbourValue, draftValue) !== "worse") return [];
    return [{
      type: "feature_worse_than_cheaper_plan" as const,
      severity: "warning" as const,
      planCode: below.code,
      feature,
      neighbourValue,
      draftValue,
      neighbourCostsSame,
    }];
  });
}

/**
 * Getting more for less can be intentional (a promotion), so this is only informative:
 * it flags where the draft could pull customers down from the pricier plan.
 */
function compareFeaturesWithPricierPlan(summary: DraftSummary, above: PlanSummary): DraftWarning[] {
  const aboveByCode = new Map(above.currentFeatures.map((entry) => [entry.feature.code, entry.value]));
  return summary.features.flatMap(({ feature, value: draftValue }) => {
    const neighbourValue = aboveByCode.get(feature.code);
    if (!neighbourValue || compareFeatureValues(neighbourValue, draftValue) !== "better") return [];
    return [{
      type: "feature_better_than_pricier_plan" as const,
      severity: "info" as const,
      planCode: above.code,
      feature,
      neighbourValue,
      draftValue,
    }];
  });
}
