"use client";

import { useRef } from "react";
import { useFlipReorder } from "@/components/create-plan/use-flip-reorder";
import { VisibilityBadge } from "@/components/plans/visibility-badge";
import type { LadderEntry, PeriodPricing } from "@/lib/derive/types";
import { formatCompactNumber, formatMoney } from "@/lib/format";

const DRAFT_KEY = "__draft__";

type LadderListProps = {
  entries: LadderEntry[];
  isPlaced: boolean;
  /** The badge on the new plan: "Draft" while editing, "New" once published. */
  draftLabel: string;
  /** Once published, a solid ring (drawn over the dashed draft border) marks the plan as real. */
  isPublished?: boolean;
  /** Hide the draft's price while it is still being typed, instead of showing the $0 placeholder. */
  draftPricePending: boolean;
  currency: string;
  label: string;
};

function describeCredits(monthly: PeriodPricing | null, currency: string): string {
  if (!monthly) return "No monthly price";
  const perThousand = monthly.pricePerThousandCredits;
  const credits = `${formatCompactNumber(monthly.includedCredits)} credits`;
  return perThousand === null ? credits : `${credits} · ${formatMoney(perThousand, currency)} / 1,000`;
}

/** Cheapest first, with the draft where its price puts it. Moves are animated by `useFlipReorder`. */
export function LadderList({ entries, isPlaced, draftLabel, isPublished = false, draftPricePending, currency, label }: LadderListProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const keys = entries.map((entry) => (entry.isDraft ? DRAFT_KEY : entry.plan.code));
  useFlipReorder(listRef, keys.join(","), DRAFT_KEY);

  return (
    <ol ref={listRef} aria-label={label} className="relative space-y-1">
      {entries.map((entry, index) => {
        const key = keys[index] ?? String(index);
        if (entry.isDraft) {
          const { draft } = entry;
          return (
            <li
              key={key}
              data-flip-key={key}
              aria-current="true"
              data-new-plan={isPublished || undefined}
              className="relative z-10 rounded-control border border-dashed border-line-strong bg-surface-raised px-3 py-2"
            >
              {isPublished && (
                <span
                  aria-hidden="true"
                  data-published-ring
                  className="pointer-events-none absolute -inset-px rounded-control border border-live"
                />
              )}
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium">{draft.name || "This plan"}</span>
                  <span
                    className={`shrink-0 rounded-mark border px-1.5 text-xs ${isPublished ? "border-live text-live-ink" : "border-line-strong text-ink-muted"}`}
                  >
                    {draftLabel}
                  </span>
                  <VisibilityBadge isPublic={draft.isPublic} />
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {draftPricePending || !draft.monthly ? "—" : `${formatMoney(draft.monthly.price, currency)} / mo`}
                </span>
              </div>
              <p className="text-caption text-ink-muted tabular-nums">
                {isPlaced ? describeCredits(draft.monthly, currency) : "Not placed yet"}
              </p>
            </li>
          );
        }
        const { plan } = entry;
        return (
          <li key={key} data-flip-key={key} className="rounded-control border border-transparent px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate">{plan.name}</span>
                <VisibilityBadge isPublic={plan.isPublic} />
              </span>
              <span className="shrink-0 tabular-nums">
                {plan.monthly ? `${formatMoney(plan.monthly.price, currency)} / mo` : "—"}
              </span>
            </div>
            <p className="text-caption text-ink-muted tabular-nums">{describeCredits(plan.monthly, currency)}</p>
          </li>
        );
      })}
    </ol>
  );
}
