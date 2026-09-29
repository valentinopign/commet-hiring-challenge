import type { DraftSummary, LadderEntry, NeighbourPlans, PlanSummary } from "@/lib/derive/types";

/**
 * The closest plan at or below the given monthly price, and the closest one above it.
 * A plan with the same price counts as "below", matching where the draft is inserted.
 * Private plans are included on purpose: they are still part of the ladder a customer
 * could be moved to, and the summary carries `isPublic` so the UI can flag them.
 */
export function findNeighbourPlans(
  ladder: PlanSummary[],
  monthlyPriceInCents: number,
  excludeCode?: string,
): NeighbourPlans {
  const priced = ladder.flatMap((plan) =>
    plan.monthly && plan.code !== excludeCode ? [{ plan, price: plan.monthly.price }] : [],
  );
  const below = priced.filter((entry) => entry.price <= monthlyPriceInCents);
  const above = priced.filter((entry) => entry.price > monthlyPriceInCents);
  return {
    below: below.at(-1)?.plan ?? null,
    above: above[0]?.plan ?? null,
  };
}

/** The ladder with the draft placed after every plan priced the same or lower. */
export function insertDraftIntoLadder(
  ladder: PlanSummary[],
  draft: DraftSummary,
): LadderEntry[] {
  const entries: LadderEntry[] = ladder.map((plan) => ({ isDraft: false, plan }));
  const draftEntry: LadderEntry = { isDraft: true, draft };
  const draftMonthly = draft.monthly;

  if (!draftMonthly) return [...entries, draftEntry];

  const insertAt = ladder.findIndex(
    (plan) => plan.monthly === null || plan.monthly.price > draftMonthly.price,
  );
  if (insertAt === -1) return [...entries, draftEntry];
  return [...entries.slice(0, insertAt), draftEntry, ...entries.slice(insertAt)];
}
