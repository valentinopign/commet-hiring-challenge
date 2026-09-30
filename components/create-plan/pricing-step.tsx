"use client";

import { AmountInput } from "@/components/create-plan/amount-input";
import { DraftWarningList } from "@/components/create-plan/draft-warning-list";
import { issueMessage, type StepProps } from "@/components/create-plan/flow-data";
import { FormField } from "@/components/create-plan/form-field";
import { Reveal } from "@/components/create-plan/reveal";
import { NeighbourComparisonTable } from "@/components/create-plan/neighbour-comparison-table";
import { choiceCardClass, outlineControlClass } from "@/components/ui/control-styles";
import type { BillingInterval } from "@/lib/catalog";
import { warningStep } from "@/lib/create-plan/steps";
import { suggestYearly } from "@/lib/derive/draft-flow";
import type { PeriodPricing } from "@/lib/derive/types";
import { formatCredits, formatMoney, formatNumber, getCurrencySymbol } from "@/lib/format";

function PerThousandLine({ period, currency }: { period: PeriodPricing | null; currency: string }) {
  if (!period || period.pricePerThousandCredits === null) return null;
  return (
    <p className="mt-2 text-caption text-ink-muted tabular-nums">
      {formatMoney(period.pricePerThousandCredits, currency)} per 1,000 included credits.
    </p>
  );
}

export function PricingStep({ state, dispatch, data, derived, issues, showAllIssues }: StepProps) {
  const { draft, pending } = state;
  const { currency, yearlyReference, planNames } = data;
  const isFree = draft.pricing.type === "free";
  const symbol = getCurrencySymbol(currency);

  const isPending = (field: (typeof pending)[number]) => pending.includes(field);
  const priceOf = (interval: BillingInterval) =>
    draft.pricing.type === "standard"
      ? (draft.pricing.prices.find((price) => price.billingInterval === interval) ?? null)
      : null;
  const monthly = priceOf("monthly");
  const yearly = priceOf("yearly");
  const monthlyCredits = draft.pricing.type === "free" ? draft.pricing.includedCredits : (monthly?.includedCredits ?? 0);

  // A value still being typed shows as empty, never as the $0 placeholder the draft holds.
  const shown = (field: (typeof pending)[number], value: number | undefined) => (isPending(field) ? null : (value ?? null));
  const monthlyComplete = !isPending("monthly_credits") && (isFree || !isPending("monthly_price"));
  const suggestion =
    yearlyReference && monthly && monthlyComplete && monthly.price > 0
      ? suggestYearly(yearlyReference, monthly.price, monthlyCredits)
      : null;
  const freeMonths = yearlyReference ? yearlyReference.creditsMultiplier - yearlyReference.priceMultiplier : 0;

  const error = (field: Parameters<typeof issueMessage>[1]) => issueMessage(issues, field, showAllIssues);
  // Checks run on the draft, which holds a $0 placeholder for a missing value: wait for real numbers.
  const hasMissingValue = pending.some((field) => field.startsWith("monthly_") || field.startsWith("yearly_"));
  const priceWarnings = hasMissingValue ? [] : derived.warnings.filter((warning) => warningStep(warning) === "price");

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-ink-muted">
        Price and credits belong to the plan, not to a version. If you change them after publishing, the change reaches
        every customer on the plan at their next renewal.
      </p>

      <fieldset>
        <legend className="font-medium">Billing</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          <label className={choiceCardClass}>
            <input
              type="radio"
              name="billing"
              checked={!isFree}
              onChange={() => dispatch({ type: "set_pricing_type", pricingType: "paid" })}
              className="mt-0.5 size-4 shrink-0 accent-live"
            />
            <span>
              <span className="block font-medium">Paid</span>
              <span className="block text-caption text-ink-muted">Customers pay every month, and can pay once a year if you offer it.</span>
            </span>
          </label>
          <label className={choiceCardClass}>
            <input
              type="radio"
              name="billing"
              checked={isFree}
              onChange={() => dispatch({ type: "set_pricing_type", pricingType: "free" })}
              className="mt-0.5 size-4 shrink-0 accent-live"
            />
            <span>
              <span className="block font-medium">Free</span>
              <span className="block text-caption text-ink-muted">No charge. Customers get a set amount of credits every month.</span>
            </span>
          </label>
        </div>
      </fieldset>

      <section aria-labelledby="monthly-heading">
        <h3 id="monthly-heading" className="font-medium">Monthly</h3>
        <div className="mt-1.5 grid gap-4 sm:grid-cols-2">
          {!isFree && (
            <FormField id="monthly-price" label="Price" error={error("monthly-price")}>
              {(control) => (
                <AmountInput
                  {...control}
                  kind="money"
                  prefix={symbol}
                  suffix="/ mo"
                  placeholder="49"
                  value={shown("monthly_price", monthly?.price)}
                  onValueChange={(price) => dispatch({ type: "set_price", interval: "monthly", price })}
                />
              )}
            </FormField>
          )}
          <FormField id="monthly-credits" label="Included credits" error={error("monthly-credits")}>
            {(control) => (
              <AmountInput
                {...control}
                kind="count"
                suffix="credits / mo"
                placeholder="12500"
                value={shown("monthly_credits", monthlyCredits)}
                onValueChange={(credits) => dispatch({ type: "set_included_credits", interval: "monthly", credits })}
              />
            )}
          </FormField>
        </div>
        {monthlyComplete && <PerThousandLine period={derived.summary.monthly} currency={currency} />}
      </section>

      {!isFree && (
        <section aria-labelledby="yearly-heading">
          <h3 id="yearly-heading" className="font-medium">Yearly</h3>
          <label className="mt-1.5 flex w-fit cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={yearly !== null}
              onChange={(event) => dispatch({ type: "set_yearly_offered", offered: event.target.checked })}
              className="size-4 accent-live"
            />
            Offer yearly billing
          </label>

          {yearly && (
            <Reveal>
              <p className="mt-2 max-w-prose text-caption text-ink-muted">
                Yearly billing has its own price and its own credits; neither is calculated from the monthly ones.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <FormField id="yearly-price" label="Price" error={error("yearly-price")}>
                  {(control) => (
                    <AmountInput
                      {...control}
                      kind="money"
                      prefix={symbol}
                      suffix="/ yr"
                      placeholder="490"
                      value={shown("yearly_price", yearly.price)}
                      onValueChange={(price) => dispatch({ type: "set_price", interval: "yearly", price })}
                    />
                  )}
                </FormField>
                <FormField id="yearly-credits" label="Included credits" error={error("yearly-credits")}>
                  {(control) => (
                    <AmountInput
                      {...control}
                      kind="count"
                      suffix="credits / yr"
                      placeholder="150000"
                      value={shown("yearly_credits", yearly.includedCredits)}
                      onValueChange={(credits) => dispatch({ type: "set_included_credits", interval: "yearly", credits })}
                    />
                  )}
                </FormField>
              </div>
              {!isPending("yearly_price") && !isPending("yearly_credits") && (
                <PerThousandLine period={derived.summary.yearly} currency={currency} />
              )}

              {yearlyReference && (
                <div className="mt-3 rounded-card border border-line bg-surface-card p-3">
                  <p className="text-ink-muted">
                    Every paid plan charges {formatNumber(yearlyReference.priceMultiplier)}× the monthly price for a year and
                    includes {formatNumber(yearlyReference.creditsMultiplier)}× the monthly credits
                    {freeMonths > 0 && `, the equivalent of ${formatNumber(freeMonths)} months free`}.
                  </p>
                  {suggestion ? (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="tabular-nums">
                        For this plan: {formatMoney(suggestion.price, currency)} and {formatCredits(suggestion.includedCredits)}.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          dispatch({ type: "set_price", interval: "yearly", price: suggestion.price });
                          dispatch({ type: "set_included_credits", interval: "yearly", credits: suggestion.includedCredits });
                        }}
                        className={outlineControlClass}
                      >
                        Use these values
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-caption text-ink-muted">Enter the monthly price and credits to see the values for this plan.</p>
                  )}
                </div>
              )}
            </Reveal>
          )}
        </section>
      )}

      <NeighbourComparisonTable
        draftName={draft.name}
        draftIsPublic={draft.isPublic}
        draftMonthly={monthlyComplete ? derived.summary.monthly : null}
        position={derived.position}
        currency={currency}
      />

      <DraftWarningList warnings={priceWarnings} planNames={planNames} currency={currency} label="Checks on price and credits" />
    </div>
  );
}
