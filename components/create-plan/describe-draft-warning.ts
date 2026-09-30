import type { DraftWarning } from "@/lib/derive/types";
import { formatFeatureValue, formatMoney, formatNumber } from "@/lib/format";

export type DraftWarningCopy = { title: string; detail: string };

/**
 * The wording of every draft check, in one place so the steps and the review say the same thing.
 * Each detail gives the numbers behind the warning and why it matters to a customer.
 */
export function describeDraftWarning(
  warning: DraftWarning,
  planNames: Map<string, string>,
  currency: string,
): DraftWarningCopy {
  const money = (cents: number) => formatMoney(cents, currency);
  const planName = (code: string) => planNames.get(code) ?? code;

  switch (warning.type) {
    case "code_taken":
      return {
        title: `The code ${warning.code} is taken`,
        detail: `${planName(warning.code)} already uses it, and a code identifies one plan only.`,
      };
    case "code_invalid":
      return {
        title: "The code is not valid",
        detail: "Use lowercase letters, numbers and underscores, starting with a letter, like growth_plus.",
      };
    case "same_price_as_existing_plan":
      return {
        title: `Same monthly price as ${planName(warning.planCode)}`,
        detail: `Both cost ${money(warning.price)} a month. Two plans at one price make the choice harder for customers.`,
      };
    case "no_included_credits":
      return {
        title: "No credits included",
        detail: "Customers would start every period with nothing to spend.",
      };
    case "price_per_thousand_above_cheaper_plan":
      return {
        title: `Credits cost more than on ${planName(warning.planCode)}`,
        detail: `${money(warning.draftValue)} per 1,000 here, ${money(warning.neighbourValue)} on ${planName(warning.planCode)}, which costs less. Customers usually expect a bigger plan to be cheaper per credit.`,
      };
    case "price_per_thousand_below_pricier_plan":
      return {
        title: `Credits cost less than on ${planName(warning.planCode)}`,
        detail: `${money(warning.draftValue)} per 1,000 here, ${money(warning.neighbourValue)} on ${planName(warning.planCode)}, which costs more. Its customers would get credits cheaper by moving down.`,
      };
    case "overage_cheaper_than_included":
      return {
        title: "Extra credits cost less than included ones",
        detail: `Overage at ${money(warning.overagePricePerThousand)} per 1,000 is below the ${money(warning.includedPricePerThousand)} the plan charges for its included credits, so paying for the plan would be the expensive way to get credits.`,
      };
    case "overage_above_cheaper_plan":
      return {
        title: `Overage costs more than on ${planName(warning.planCode)}`,
        detail: `${money(warning.draftValue)} per 1,000 here, ${money(warning.neighbourValue)} on ${planName(warning.planCode)}, which costs less. Bigger plans usually pay less for extra credits.`,
      };
    case "yearly_more_expensive_than_monthly":
      return {
        title: "Yearly costs more than twelve months",
        detail: `${money(warning.yearlyPrice)} a year, against ${money(warning.twelveMonthsPrice)} paying monthly. Nobody would choose yearly billing.`,
      };
    case "yearly_fewer_credits_than_monthly":
      return {
        title: "Yearly includes fewer credits than twelve months",
        detail: `${formatNumber(warning.yearlyCredits)} credits a year, against ${formatNumber(warning.twelveMonthsCredits)} paying monthly.`,
      };
    case "free_plan_bills_overage":
      return {
        title: "A free plan that bills overage",
        detail: "Customers on a free plan would get invoices for extra credits.",
      };
    case "blocked_without_credit_packs":
      return {
        title: "No credit packs for this plan",
        detail: "No credit pack is selected, so when credits run out, upgrading is the only way to keep going.",
      };
    case "feature_worse_than_cheaper_plan": {
      const neighbour = planName(warning.planCode);
      return {
        title: `${warning.feature.name} is worse than on ${neighbour}`,
        detail: `${neighbour} costs less and gives ${formatFeatureValue({ feature: warning.feature, value: warning.neighbourValue }, currency)}; this plan gives ${formatFeatureValue({ feature: warning.feature, value: warning.draftValue }, currency)}.`,
      };
    }
    case "feature_better_than_pricier_plan": {
      const neighbour = planName(warning.planCode);
      return {
        title: `${warning.feature.name} is better than on ${neighbour}`,
        detail: `${neighbour} costs more and gives ${formatFeatureValue({ feature: warning.feature, value: warning.neighbourValue }, currency)}; this plan gives ${formatFeatureValue({ feature: warning.feature, value: warning.draftValue }, currency)}. Fine for a promotion; otherwise it could pull customers down from ${neighbour}.`,
      };
    }
  }
}
