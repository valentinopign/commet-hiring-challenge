import type { BillingInterval, Catalog, Plan } from "@/lib/catalog";
import { getPlacedMonthlyPrice, type DraftFlowState } from "@/lib/create-plan/draft-reducer";
import { getDraftPosition } from "@/lib/derive/draft-flow";
import { getPeriodPricing, getPlanLadder } from "@/lib/derive/plans";

/** Neighbours follow the edited monthly price; comparisons use each interval's actual values. */
export function deriveEditPricingContext(catalog: Catalog, plan: Plan, state: DraftFlowState) {
  const monthlyPrice = getPlacedMonthlyPrice(state);
  const position = getDraftPosition(getPlanLadder(catalog), monthlyPrice, plan.code);
  const monthly = getPeriodPricing(state.draft.pricing, "monthly");
  const yearly = getPeriodPricing(state.draft.pricing, "yearly");
  return {
    comparisonReady: monthlyPrice !== null,
    periods: (["monthly", "yearly"] as BillingInterval[]).map((interval) => {
      const period = interval === "monthly" ? monthly : yearly;
      const priceReady = !state.pending.includes(`${interval}_price`);
      const creditsReady = !state.pending.includes(`${interval}_credits`);
      const neighbours = [position?.below, position?.above].flatMap((neighbour, index) => {
        if (!neighbour) return [];
        const pricing = interval === "monthly" ? neighbour.monthly : neighbour.yearly;
        return [{ code: neighbour.code, name: neighbour.name, isPublic: neighbour.isPublic, relation: index === 0 ? "below" as const : "above" as const, pricing }];
      });
      return {
        interval, period, priceReady, creditsReady, neighbours,
        includedCreditCost: period && priceReady && creditsReady ? period.pricePerThousandCredits : null,
        // A comparison against twelve real monthly payments, never a suggested yearly price.
        annualSaving: interval === "yearly" && yearly && monthly && priceReady && !state.pending.includes("monthly_price")
          ? monthly.price * 12 - yearly.price : null,
      };
    }),
  };
}

export type EditPricingContext = ReturnType<typeof deriveEditPricingContext>;
export type EditPeriodContext = EditPricingContext["periods"][number];
