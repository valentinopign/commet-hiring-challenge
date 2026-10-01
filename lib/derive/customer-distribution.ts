import type { Catalog } from "@/lib/catalog";
import { findPlanByCode, getPlanLadder } from "@/lib/derive/plans";
import { isPaidPlan, toWholePercentages } from "@/lib/derive/subscriptions";
import type { CustomerDistribution, CustomerSegment } from "@/lib/derive/types";

/**
 * How the customer base splits across plans, in ladder order. Percentages use the largest
 * remainder method, so a plan with a handful of customers can round to 0%: the count is
 * still there for the UI to say "<1%" instead of hiding it.
 */
export function getCustomerDistribution(catalog: Catalog): CustomerDistribution {
  const ladder = getPlanLadder(catalog);
  const counts = ladder.map((plan) => plan.totalSubscriptions);
  const totalCustomers = counts.reduce((total, count) => total + count, 0);
  const percents = toWholePercentages(counts);

  let paidPlanCount = 0;
  const segments: CustomerSegment[] = ladder.map((plan, index) => {
    const source = findPlanByCode(catalog, plan.code);
    const isPaid = source ? isPaidPlan(source) : false;
    const paidRank = isPaid ? paidPlanCount++ : null;
    return {
      planCode: plan.code,
      planName: plan.name,
      customers: counts[index],
      share: totalCustomers > 0 ? counts[index] / totalCustomers : 0,
      percent: percents[index],
      isPaid,
      paidRank,
    };
  });

  // Ties go to the cheaper plan, the first one met in ladder order.
  const largest = segments.reduce<CustomerSegment | null>(
    (best, segment) => (segment.customers > (best?.customers ?? 0) ? segment : best),
    null,
  );

  return { totalCustomers, segments, paidPlanCount, largest };
}

/**
 * Which step of a ramp with `stepCount` steps a paid plan takes, spreading the plans over the
 * whole ramp so the cheapest is always the lightest and the dearest the darkest. With more plans
 * than steps, neighbours can share a step; the gap between segments and the legend still tell
 * them apart. A single paid plan takes the darkest step.
 */
export function getRampStep(paidRank: number, paidPlanCount: number, stepCount: number): number {
  if (paidPlanCount <= 1 || stepCount <= 1) return Math.max(stepCount - 1, 0);
  return Math.round((paidRank * (stepCount - 1)) / (paidPlanCount - 1));
}
