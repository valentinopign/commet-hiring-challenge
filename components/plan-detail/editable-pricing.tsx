"use client";

import type { Dispatch } from "react";
import { AmountInput } from "@/components/create-plan/amount-input";
import { FieldError } from "@/components/create-plan/field-error";
import { PolicyOption } from "@/components/create-plan/policy-option";
import { VersionSplitBar } from "@/components/plans/version-split-bar";
import { EditCustomerContext } from "@/components/plan-detail/edit-customer-context";
import { EditPricingContext } from "@/components/plan-detail/edit-pricing-context";
import { EditChangeMark } from "@/components/plan-detail/edit-change-mark";
import { UsersIcon } from "@/components/icons/users-icon";
import { CoinsIcon } from "@/components/icons/coins-icon";
import type { BillingInterval } from "@/lib/catalog";
import type { DraftFlowAction, DraftFlowState } from "@/lib/create-plan/draft-reducer";
import type { StepIssue } from "@/lib/create-plan/steps";
import type { PlanSummary } from "@/lib/derive/types";
import type { PlanChanges, PlanChangeField } from "@/lib/edit-plan/changes";
import type { EditPricingContext as PricingContextData } from "@/lib/edit-plan/pricing-context";
import { formatMoney, formatCount, formatNumber, getCurrencySymbol } from "@/lib/format";

type Props = { state: DraftFlowState; dispatch: Dispatch<DraftFlowAction>; changes: PlanChanges; plan: PlanSummary; currency: string; issues: StepIssue[]; pricingContext: PricingContextData; migration?: { operationCount: number; customers: number; targetVersion: number } };

export function EditablePricing({ state, dispatch, changes, plan, currency, issues, pricingContext, migration }: Props) {
  const { draft, pending } = state;
  const error = (id: string) => issues.find((issue) => issue.field === id)?.message;
  const mark = (field: PlanChangeField) => {
    const change = changes.planChanges.find((entry) => entry.field === field);
    if (!change) return null;
    const describe = (value: typeof change.before): string => {
      if (typeof value === "number") return field.endsWith("credits") ? `${formatNumber(value)} credits` : formatMoney(value, currency);
      if (typeof value === "object") return value.type === "block" ? "Stop the service" : `Bill ${formatMoney(value.pricePer1000Credits, currency)} / 1,000 extra credits`;
      return String(value);
    };
    return <EditChangeMark before={describe(change.before)} after={describe(change.after)} impact={change.impact} />;
  };
  const periodCard = (interval: BillingInterval) => {
    const context = pricingContext.periods.find((entry) => entry.interval === interval);
    if (!context) return null;
    const period = context.period;
    const priceId = `${interval}-price`;
    const creditsId = `${interval}-credits`;
    const title = interval === "monthly" ? "Monthly" : "Yearly";
    return <div className="flex flex-col overflow-hidden rounded-card border border-line">
      <dt className="flex items-center gap-2 border-b border-line bg-surface-raised px-3.5 py-2 text-caption text-ink-muted"><CoinsIcon className="size-4 shrink-0" />{title}</dt>
      <dd className="flex flex-1 flex-col gap-4 bg-surface-card px-3.5 py-3">
        {period ? <>
          <div>
            {draft.pricing.type === "free" ? <p className="text-lg font-medium">Free</p> : <>
              <label htmlFor={priceId} className="mb-1 block text-caption">{title} price</label>
              <AmountInput id={priceId} kind="money" prefix={getCurrencySymbol(currency)} value={pending.includes(`${interval}_price`) ? null : period.price} onValueChange={(price) => dispatch({ type: "set_price", interval, price })} aria-invalid={error(priceId) ? true : undefined} aria-describedby={error(priceId) ? `${priceId}-error` : context.annualSaving !== null ? `${priceId}-saving` : undefined} />
              <div className="pt-1 xl:min-h-5">
                {context.annualSaving !== null && <p id={`${priceId}-saving`} className="text-xs text-ink-muted tabular-nums">
                  {context.annualSaving > 0 ? `Save ${formatMoney(context.annualSaving, currency)} / yr` : context.annualSaving < 0 ? `${formatMoney(-context.annualSaving, currency)} more / yr` : "Same yearly total"}
                  <span className="sr-only"> compared with 12 monthly payments.</span>
                </p>}
              </div>
              {error(priceId) && <FieldError id={`${priceId}-error`} message={error(priceId) ?? ""} />}
            </>}
            {mark(`${interval}_price`)}
          </div>
          <div>
            <label htmlFor={creditsId} className="mb-1 block text-caption">{title} included credits</label>
            <AmountInput id={creditsId} kind="count" value={pending.includes(`${interval}_credits`) ? null : period.includedCredits} onValueChange={(credits) => dispatch({ type: "set_included_credits", interval, credits })} aria-invalid={error(creditsId) ? true : undefined} aria-describedby={error(creditsId) ? `${creditsId}-error` : undefined} />
            {error(creditsId) && <FieldError id={`${creditsId}-error`} message={error(creditsId) ?? ""} />}
            {mark(`${interval}_credits`)}
          </div>
          <EditPricingContext context={context} comparisonReady={pricingContext.comparisonReady} currency={currency} />
        </> : <p className="text-caption text-ink-muted">Not offered. Billing periods stay unchanged.</p>}
      </dd>
    </div>;
  };
  return <section id="pricing" aria-labelledby="pricing-heading" className="mt-4">
    <h2 id="pricing-heading" className="sr-only">Pricing</h2>
    <p className="mb-3 text-caption text-ink-muted">Price, credits and exhaustion policy apply to all {formatCount(changes.totalCustomers, "customer")} across all versions, at their next renewal.</p>
    <dl className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="flex flex-col overflow-hidden rounded-card border border-line">
        <dt className="flex items-center gap-2 border-b border-line bg-surface-raised px-3.5 py-2 text-caption text-ink-muted"><UsersIcon className="size-4 shrink-0" />Customers</dt>
        <dd className="flex flex-1 flex-col gap-3 bg-surface-card px-3.5 py-3">
          <p className="text-2xl font-semibold tabular-nums">{formatNumber(changes.totalCustomers)}</p>
          <VersionSplitBar versions={plan.versionSplit} showPercentages={false} />
          <EditCustomerContext versions={plan.versionSplit} changes={changes} migration={migration} />
          <p className="mt-auto border-t border-line pt-3 text-caption text-ink-muted">Existing customers keep their version. Optional migration in Review.</p>
        </dd>
      </div>
      {periodCard("monthly")}
      {periodCard("yearly")}
      <div className="flex flex-col overflow-hidden rounded-card border border-line">
        <dt className="border-b border-line bg-surface-raised px-3.5 py-2 text-caption text-ink-muted">When credits run out</dt>
        <dd className="flex flex-1 flex-col gap-3 bg-surface-card px-3.5 py-3 text-sm">
          <fieldset className="space-y-2">
            <legend className="sr-only">Exhaustion policy</legend>
            <PolicyOption compact id="exhaustion-policy" value="block" checked={draft.exhaustionPolicy.type === "block"} describedBy={draft.exhaustionPolicy.type === "block" ? "edit-policy-description" : undefined} title="Stop the service" onChoose={() => dispatch({ type: "choose_exhaustion", policy: "block" })} />
            <PolicyOption compact value="bill_overage" checked={draft.exhaustionPolicy.type === "bill_overage"} describedBy={draft.exhaustionPolicy.type === "bill_overage" ? "edit-policy-description" : undefined} title="Bill the extra" onChoose={() => dispatch({ type: "choose_exhaustion", policy: "bill_overage" })} />
          </fieldset>
          <p id="edit-policy-description" className="text-caption text-ink-muted">{draft.exhaustionPolicy.type === "block"
            ? draft.creditPackCodes.length > 0 ? "Credit actions stop until credits renew, a pack is purchased or the customer upgrades." : "Credit actions stop until credits renew or the customer upgrades."
            : "Work continues; extra usage increases the next invoice."}</p>
          {draft.exhaustionPolicy.type === "bill_overage" && <div>
            <label htmlFor="overage-price" className="mb-1 block text-caption">Price per 1,000 extra credits</label>
            <AmountInput id="overage-price" kind="money" prefix={getCurrencySymbol(currency)} value={pending.includes("overage_price") ? null : draft.exhaustionPolicy.pricePer1000Credits} onValueChange={(price) => dispatch({ type: "set_overage_price", price })} aria-invalid={error("overage-price") ? true : undefined} aria-describedby={error("overage-price") ? "overage-price-error" : undefined} />
            {error("overage-price") && <FieldError id="overage-price-error" message={error("overage-price") ?? ""} />}
          </div>}
          {mark("exhaustion_policy")}{mark("overage_price")}
          <p className="mt-auto border-t border-line pt-3 text-caption text-ink-muted">Credit packs stay unchanged.</p>
        </dd>
      </div>
    </dl>
  </section>;
}
