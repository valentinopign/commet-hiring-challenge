"use client";

import type { ReactNode } from "react";
import { AmountInput } from "@/components/create-plan/amount-input";
import { CreditPackSelector } from "@/components/create-plan/credit-pack-selector";
import { DraftWarningList } from "@/components/create-plan/draft-warning-list";
import { FieldError } from "@/components/create-plan/field-error";
import { issueMessage, type StepProps } from "@/components/create-plan/flow-data";
import { FormField } from "@/components/create-plan/form-field";
import { WidgetHeader } from "@/components/ui/widget-header";
import type { ExhaustionPolicy } from "@/lib/catalog";
import { warningStep } from "@/lib/create-plan/steps";
import type { PlanSummary } from "@/lib/derive/types";
import { formatMoney, formatSavings, getCurrencySymbol } from "@/lib/format";

function listNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function describePolicy(policy: ExhaustionPolicy, currency: string): string {
  return policy.type === "block"
    ? "stops the service"
    : `${formatMoney(policy.pricePer1000Credits, currency)} per 1,000 extra credits`;
}

type PolicyOptionProps = {
  id?: string;
  value: ExhaustionPolicy["type"];
  checked: boolean;
  title: string;
  usedBy: string[];
  describedBy?: string;
  onChoose: () => void;
  children: ReactNode;
};

/** The explanation sits inside the option, so it is read before choosing, not after. */
function PolicyOption({ id, value, checked, title, usedBy, describedBy, onChoose, children }: PolicyOptionProps) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-card border border-line bg-surface-card p-4 transition-colors hover:border-line-strong has-checked:border-live has-checked:bg-live-soft">
      <input
        id={id}
        type="radio"
        name="exhaustion-policy"
        value={value}
        checked={checked}
        onChange={onChoose}
        aria-describedby={describedBy}
        className="mt-0.5 size-4 shrink-0 accent-live"
      />
      <span className="min-w-0 space-y-1.5">
        <span className="block font-medium">{title}</span>
        <span className="block space-y-1.5 text-ink-muted">{children}</span>
        {usedBy.length > 0 && (
          <span className="block text-caption text-ink-muted">Today: {listNames(usedBy)}.</span>
        )}
      </span>
    </label>
  );
}

function neighbourLine(plan: PlanSummary | null, relation: string, currency: string) {
  if (!plan) return null;
  return (
    <li>
      <span className="font-medium">{plan.name}</span> <span className="text-ink-muted">({relation})</span>:{" "}
      {describePolicy(plan.exhaustionPolicy, currency)}
    </li>
  );
}

export function ExhaustionStep({ state, dispatch, data, derived, issues, showAllIssues }: StepProps) {
  const { draft, pending } = state;
  const { currency, ladder, packs, planNames } = data;
  const policyChosen = !pending.includes("exhaustion_policy");
  const policy = draft.exhaustionPolicy;
  const overagePending = pending.includes("overage_price");

  const usedBy = (type: ExhaustionPolicy["type"]) =>
    ladder.filter((plan) => plan.exhaustionPolicy.type === type).map((plan) => plan.name);
  const choiceError = issueMessage(issues, "exhaustion-policy", showAllIssues);
  const overageError = issueMessage(issues, "overage-price", showAllIssues);

  const includedPerThousand = derived.summary.monthly?.pricePerThousandCredits ?? null;
  const position = derived.position;
  // Each pack is compared with the overage only once there is a real overage price to compare with.
  const comparablePolicy = policyChosen && policy.type === "bill_overage" && !overagePending && policy.pricePer1000Credits > 0
    ? policy
    : null;

  // Includes "no credit packs" for a blocking plan with none ticked: upgrading is then the only way out.
  const stepWarnings = policyChosen && !overagePending
    ? derived.warnings.filter((warning) => warningStep(warning) === "credits-run-out")
    : [];

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-ink-muted">
        Like the price, this belongs to the plan: it applies to every customer on it, on every version. Read what each
        option means for them before choosing.
      </p>

      <fieldset>
        <legend className="font-medium">When a customer uses up their credits</legend>
        <div className="mt-1.5 grid gap-2">
          <PolicyOption
            id="exhaustion-policy"
            value="block"
            checked={policyChosen && policy.type === "block"}
            title="Stop the service"
            usedBy={usedBy("block")}
            describedBy={choiceError ? "exhaustion-policy-error" : undefined}
            onChoose={() => dispatch({ type: "choose_exhaustion", policy: "block" })}
          >
            <span className="block">
              Every action that spends credits stops until their credits renew or they upgrade. They never get a
              surprise charge, but work can stop halfway through.
            </span>
          </PolicyOption>
          <PolicyOption
            value="bill_overage"
            checked={policyChosen && policy.type === "bill_overage"}
            title="Bill the extra"
            usedBy={usedBy("bill_overage")}
            onChoose={() => dispatch({ type: "choose_exhaustion", policy: "bill_overage" })}
          >
            <span className="block">
              The product keeps working. Every extra 1,000 credits is billed at the price you set, on their next
              invoice. No interruptions, but the invoice can grow.
            </span>
          </PolicyOption>
        </div>
        {choiceError && <FieldError id="exhaustion-policy-error" message={choiceError} />}
      </fieldset>

      {policyChosen && policy.type === "bill_overage" && (
        <>
          <div className="max-w-sm">
            <FormField id="overage-price" label="Price of 1,000 extra credits" error={overageError}>
              {(control) => (
                <AmountInput
                  {...control}
                  kind="money"
                  prefix={getCurrencySymbol(currency)}
                  suffix="per 1,000"
                  placeholder="10"
                  value={overagePending ? null : policy.pricePer1000Credits}
                  onValueChange={(price) => dispatch({ type: "set_overage_price", price })}
                />
              )}
            </FormField>
          </div>

          <section aria-labelledby="overage-context-heading" className="overflow-hidden rounded-card border border-line">
            <WidgetHeader title={<h3 id="overage-context-heading" className="font-medium">What to compare it with</h3>} />
            <ul className="space-y-2 bg-surface-card px-4 py-3">
              {includedPerThousand !== null && includedPerThousand > 0 && (
                <li>
                  <span className="font-medium">Included credits on this plan</span> cost{" "}
                  {formatMoney(includedPerThousand, currency)} per 1,000.
                  {!overagePending && policy.pricePer1000Credits > 0 && (
                    <>
                      {" "}Overage at {formatMoney(policy.pricePer1000Credits, currency)} is{" "}
                      {formatSavings(1 - policy.pricePer1000Credits / includedPerThousand, "the included credits")}.
                    </>
                  )}
                </li>
              )}
              {neighbourLine(position?.below ?? null, "costs less", currency)}
              {neighbourLine(position?.above ?? null, "costs more", currency)}
            </ul>
          </section>
        </>
      )}

      {policyChosen && (
        <CreditPackSelector
          packs={packs}
          selectedCodes={derived.draft.creditPackCodes}
          suggestion={derived.packSuggestion}
          chosenByHand={state.packsChosenByHand}
          position={position}
          exhaustionPolicy={comparablePolicy}
          ladder={ladder}
          currency={currency}
          dispatch={dispatch}
        />
      )}

      <DraftWarningList
        warnings={stepWarnings}
        planNames={planNames}
        currency={currency}
        label="Checks on what happens when credits run out"
      />
    </div>
  );
}
