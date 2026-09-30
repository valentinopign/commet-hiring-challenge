"use client";

import type { Dispatch } from "react";
import { InfoIcon } from "@/components/icons/info-icon";
import { WidgetHeader } from "@/components/ui/widget-header";
import { PacksIcon } from "@/components/icons/packs-icon";
import type { ExhaustionPolicy } from "@/lib/catalog";
import type { DraftFlowAction } from "@/lib/create-plan/draft-reducer";
import { getSavingsVersusOverage } from "@/lib/derive/credit-packs";
import type { PackSuggestion } from "@/lib/derive/draft-flow";
import type { CreditPackSummary, NeighbourPlans, PlanSummary } from "@/lib/derive/types";
import { formatMoney, formatNumber, formatSavings } from "@/lib/format";

type CreditPackSelectorProps = {
  packs: CreditPackSummary[];
  selectedCodes: string[];
  suggestion: PackSuggestion;
  chosenByHand: boolean;
  position: NeighbourPlans | null;
  /** Only an overage with a price set gives each pack something to be compared with. */
  exhaustionPolicy: ExhaustionPolicy | null;
  ladder: PlanSummary[];
  currency: string;
  dispatch: Dispatch<DraftFlowAction>;
};

function listNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** Why these packs are ticked, naming the plans the suggestion comes from. */
function describeSuggestion(suggestion: PackSuggestion, position: NeighbourPlans | null): string {
  const below = position?.below?.name;
  const above = position?.above?.name;
  switch (suggestion.basis) {
    case "both":
      return suggestion.codes.length > 0
        ? `Suggested: the packs both ${below} and ${above} sell.`
        : `${below} and ${above} share no pack, so none is suggested.`;
    case "below":
      return above ? `Suggested: the packs ${below} sells (${above} sells none).` : `Suggested: the packs ${below} sells.`;
    case "above":
      return below ? `Suggested: the packs ${above} sells (${below} sells none).` : `Suggested: the packs ${above} sells.`;
    case "none":
      return below || above ? "The plans around this one sell no packs, so none is suggested." : "No plans to take a suggestion from.";
  }
}

export function CreditPackSelector({
  packs,
  selectedCodes,
  suggestion,
  chosenByHand,
  position,
  exhaustionPolicy,
  ladder,
  currency,
  dispatch,
}: CreditPackSelectorProps) {
  if (packs.length === 0) return null;
  // "Today on" follows the ladder's order rather than the order the pack lists its plans.
  const plansInOrder = ladder.map((plan) => ({ code: plan.code, name: plan.name }));
  const matchesSuggestion =
    selectedCodes.length === suggestion.codes.length && selectedCodes.every((code) => suggestion.codes.includes(code));

  function toggle(code: string, selected: boolean) {
    const codes = selected ? [...selectedCodes, code] : selectedCodes.filter((candidate) => candidate !== code);
    dispatch({ type: "set_credit_packs", codes });
  }

  return (
    <section aria-labelledby="packs-heading" className="overflow-hidden rounded-card border border-line">
      <WidgetHeader
        icon={<PacksIcon className="size-4 shrink-0 text-ink-muted" />}
        title={<h3 id="packs-heading" className="font-medium">Credit packs</h3>}
      />
      <div className="bg-surface-card px-4 py-3">
        <p className="text-ink-muted">
          Customers buy them to top up without changing plan. Their credits expire.
        </p>
        <div className="mt-2 flex flex-wrap items-start gap-x-3 gap-y-1 text-caption text-ink-muted">
          <p className="flex items-start gap-1.5">
            <InfoIcon className="mt-px size-3.5 shrink-0" />
            <span>{describeSuggestion(suggestion, position)} Change it freely.</span>
          </p>
          {chosenByHand && !matchesSuggestion && (
            <button
              type="button"
              onClick={() => dispatch({ type: "use_suggested_packs" })}
              className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
            >
              Use the suggestion
            </button>
          )}
        </div>

        <fieldset className="mt-3">
          <legend className="sr-only">Credit packs sold on this plan</legend>
          <ul className="divide-y divide-line">
            {packs.map((pack) => {
              const selected = selectedCodes.includes(pack.code);
              const todayOn = plansInOrder.filter((plan) => pack.planCodes.includes(plan.code)).map((plan) => plan.name);
              const savings = exhaustionPolicy ? getSavingsVersusOverage(pack.pricePerThousandCredits, exhaustionPolicy) : null;
              const detailsId = `pack-${pack.code}-details`;
              return (
                <li key={pack.code} className="py-2.5">
                  <label className="flex cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => toggle(pack.code, event.target.checked)}
                      aria-describedby={detailsId}
                      className="mt-0.5 size-4 shrink-0 accent-live"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-medium">{formatNumber(pack.credits)} credits</span>
                        <span className="shrink-0 font-medium tabular-nums">{formatMoney(pack.price, currency)}</span>
                      </span>
                      <span id={detailsId} className="block text-caption text-ink-muted tabular-nums">
                        {pack.pricePerThousandCredits !== null && `${formatMoney(pack.pricePerThousandCredits, currency)} / 1,000 · `}
                        expires {pack.expiresAfterDays} days after purchase
                        <span className="block">
                          {todayOn.length > 0 ? `Today on ${listNames(todayOn)}` : "Today on no plan"}
                        </span>
                        {savings !== null && (
                          <span className="block text-ink">{formatSavings(savings, "this plan's overage")}</span>
                        )}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      </div>
    </section>
  );
}
