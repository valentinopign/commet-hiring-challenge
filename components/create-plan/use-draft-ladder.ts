"use client";

import { useDebouncedValue } from "@/components/create-plan/use-debounced-value";
import { getDraftLadder } from "@/lib/derive/draft-flow";
import type { DraftSummary, LadderEntry, PlanSummary } from "@/lib/derive/types";

/**
 * Typing "299" passes through 2 and 29; placing the draft on every keystroke would make it jump
 * three times. The place waits for the price to settle; the draft's numbers update at once.
 */
const SETTLE_DELAY = 350;

export type DraftLadderView = {
  entries: LadderEntry[];
  isPlaced: boolean;
  /** Where the draft sits, in words: shown above the list and announced when it changes. */
  positionText: string;
};

function describePosition(entries: LadderEntry[], isPlaced: boolean): string {
  if (!isPlaced) return "Enter a monthly price to place it on the ladder.";
  const index = entries.findIndex((entry) => entry.isDraft);
  const below = entries[index - 1];
  const above = entries[index + 1];
  const name = (entry: LadderEntry | undefined) => (entry && !entry.isDraft ? entry.plan.name : null);
  const belowName = name(below);
  const aboveName = name(above);
  if (belowName && aboveName) return `Between ${belowName} and ${aboveName}.`;
  if (belowName) return `Above ${belowName}, the priciest plan today.`;
  if (aboveName) return `Below ${aboveName}, the cheapest plan today.`;
  return "This will be your first plan.";
}

export function useDraftLadder(ladder: PlanSummary[], draft: DraftSummary, placedMonthlyPrice: number | null): DraftLadderView {
  const settledPrice = useDebouncedValue(placedMonthlyPrice, SETTLE_DELAY);
  // A price that disappears (the field was cleared) unplaces the draft at once; only moves wait.
  const price = placedMonthlyPrice === null ? null : settledPrice;
  const { entries, isPlaced } = getDraftLadder(ladder, draft, price);
  return { entries, isPlaced, positionText: describePosition(entries, isPlaced) };
}
