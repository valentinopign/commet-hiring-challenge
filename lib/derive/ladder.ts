import type { Catalog } from "@/lib/catalog";
import { comparePacksWithOverage } from "@/lib/derive/credit-packs";
import { getPlanLadder } from "@/lib/derive/plans";
import type { LadderRow, LadderStep, PlanSummary } from "@/lib/derive/types";

/** What it costs, and what it gives, to move up from the previous rung. */
export function getLadderStep(previous: PlanSummary | undefined, plan: PlanSummary): LadderStep | null {
  if (!previous?.monthly || !plan.monthly) return null;
  return {
    fromPlanCode: previous.code,
    fromPlanName: previous.name,
    priceDifference: plan.monthly.price - previous.monthly.price,
    creditsDifference: plan.monthly.includedCredits - previous.monthly.includedCredits,
  };
}

/** Everything the overview ladder shows, cheapest plan first. */
export function getLadderRows(catalog: Catalog): LadderRow[] {
  const ladder = getPlanLadder(catalog);
  return ladder.map((plan, index) => ({
    plan,
    step: getLadderStep(ladder[index - 1], plan),
    packComparison: comparePacksWithOverage(catalog, plan.code, plan.exhaustionPolicy),
  }));
}
