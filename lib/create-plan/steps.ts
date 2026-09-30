import type { BillingInterval, PlanPricing } from "@/lib/catalog";
import type { DraftFlowState, PendingField } from "@/lib/create-plan/draft-reducer";
import { PLAN_CODE_PATTERN } from "@/lib/derive/sanity-checks";
import type { DraftWarning } from "@/lib/derive/types";

/**
 * The steps of the flow, in order. A future "new version of an existing plan" mode would reuse
 * this table with the code locked in the first step; nothing below assumes a brand new plan
 * except the checks on the code.
 */
export const CREATE_PLAN_STEPS = [
  { id: "position", title: "Position" },
  { id: "price", title: "Price and credits" },
  { id: "credits-run-out", title: "When credits run out" },
  { id: "features", title: "Features" },
  { id: "review", title: "Review" },
] as const;

export type StepId = (typeof CREATE_PLAN_STEPS)[number]["id"];

/** The DOM id of the control an issue points to, so "Continue" can move focus there. */
export type FieldId =
  | "plan-name"
  | "plan-code"
  | "monthly-price"
  | "monthly-credits"
  | "yearly-price"
  | "yearly-credits"
  | "exhaustion-policy"
  | "overage-price";

export type StepIssue = { field: FieldId; message: string };

export type ExistingPlan = { code: string; name: string };

export function stepIndex(step: StepId): number {
  return CREATE_PLAN_STEPS.findIndex((candidate) => candidate.id === step);
}

export function parseStepParam(value: string | null | undefined): StepId | null {
  return CREATE_PLAN_STEPS.find((step) => step.id === value)?.id ?? null;
}

function validatePosition({ draft }: DraftFlowState, existingPlans: ExistingPlan[]): StepIssue[] {
  const issues: StepIssue[] = [];
  if (draft.name.trim() === "") issues.push({ field: "plan-name", message: "Give the plan a name." });

  const owner = existingPlans.find((plan) => plan.code === draft.code);
  if (draft.code === "") {
    issues.push({ field: "plan-code", message: "Add a code." });
  } else if (!PLAN_CODE_PATTERN.test(draft.code)) {
    issues.push({
      field: "plan-code",
      message: "Use lowercase letters, numbers and underscores, starting with a letter, like growth_plus.",
    });
  } else if (owner) {
    issues.push({ field: "plan-code", message: `${owner.name} already uses this code.` });
  }
  return issues;
}

function priceOf(pricing: PlanPricing, interval: BillingInterval): number | null {
  if (pricing.type === "free") return null;
  return pricing.prices.find((price) => price.billingInterval === interval)?.price ?? null;
}

function validatePrice({ draft, pending }: DraftFlowState): StepIssue[] {
  const issues: StepIssue[] = [];
  const isPending = (field: PendingField) => pending.includes(field);
  const needsPositivePrice = "A paid plan needs a price above $0. To offer it for nothing, choose Free.";

  if (draft.pricing.type === "standard") {
    const monthlyPrice = priceOf(draft.pricing, "monthly");
    if (isPending("monthly_price")) issues.push({ field: "monthly-price", message: "Set a monthly price." });
    else if (monthlyPrice === 0) issues.push({ field: "monthly-price", message: needsPositivePrice });
  }
  if (isPending("monthly_credits")) {
    issues.push({ field: "monthly-credits", message: "Set the credits included each month." });
  }

  const yearlyPrice = priceOf(draft.pricing, "yearly");
  if (yearlyPrice !== null) {
    if (isPending("yearly_price")) issues.push({ field: "yearly-price", message: "Set a yearly price." });
    else if (yearlyPrice === 0) issues.push({ field: "yearly-price", message: needsPositivePrice });
    if (isPending("yearly_credits")) {
      issues.push({ field: "yearly-credits", message: "Set the credits included each year." });
    }
  }
  return issues;
}

function validateCreditsRunOut({ draft, pending }: DraftFlowState): StepIssue[] {
  if (pending.includes("exhaustion_policy")) {
    return [{ field: "exhaustion-policy", message: "Choose what happens when credits run out." }];
  }
  if (draft.exhaustionPolicy.type !== "bill_overage") return [];
  if (pending.includes("overage_price")) {
    return [{ field: "overage-price", message: "Set the price of 1,000 extra credits." }];
  }
  if (draft.exhaustionPolicy.pricePer1000Credits === 0) {
    return [{
      field: "overage-price",
      message: "Overage needs a price above $0. To stop the service instead, choose Stop the service.",
    }];
  }
  return [];
}

/** What stops "Continue" on a step. Going back is never validated. */
export function validateStep(step: StepId, state: DraftFlowState, existingPlans: ExistingPlan[]): StepIssue[] {
  switch (step) {
    case "position":
      return validatePosition(state, existingPlans);
    case "price":
      return validatePrice(state);
    case "credits-run-out":
      return validateCreditsRunOut(state);
    // Features have no required value: a plan may include none of them.
    case "features":
    case "review":
      return [];
  }
}

/** The furthest step the person can reach: the first one with something missing, or the review. */
export function firstIncompleteStep(state: DraftFlowState, existingPlans: ExistingPlan[]): StepId {
  const incomplete = CREATE_PLAN_STEPS.find((step) => validateStep(step.id, state, existingPlans).length > 0);
  return incomplete?.id ?? "review";
}

/**
 * The step to show for a `?step=` value. Unknown values open the first step, and a step past the
 * first incomplete one (a reload loses the draft, or a hand-edited URL) opens that one instead.
 */
export function resolveStep(requested: string | null | undefined, state: DraftFlowState, existingPlans: ExistingPlan[]): StepId {
  const step = parseStepParam(requested) ?? "position";
  const furthest = firstIncompleteStep(state, existingPlans);
  return stepIndex(step) > stepIndex(furthest) ? furthest : step;
}

/** The step where a review warning can be fixed, so the review can link straight to it. */
export function warningStep(warning: DraftWarning): StepId {
  switch (warning.type) {
    case "code_taken":
    case "code_invalid":
      return "position";
    case "same_price_as_existing_plan":
    case "no_included_credits":
    case "price_per_thousand_above_cheaper_plan":
    case "price_per_thousand_below_pricier_plan":
    case "yearly_more_expensive_than_monthly":
    case "yearly_fewer_credits_than_monthly":
      return "price";
    case "overage_cheaper_than_included":
    case "overage_above_cheaper_plan":
    case "free_plan_bills_overage":
    case "blocked_without_credit_packs":
      return "credits-run-out";
    case "feature_worse_than_cheaper_plan":
    case "feature_better_than_pricier_plan":
      return "features";
  }
}
