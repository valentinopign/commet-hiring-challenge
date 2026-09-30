"use client";

import type { Dispatch } from "react";
import { AmountInput } from "@/components/create-plan/amount-input";
import { FieldError } from "@/components/create-plan/field-error";
import { FeatureNeighbours } from "@/components/create-plan/feature-neighbours";
import type { CapacityLimit, CatalogFeature, ReleaseFeature } from "@/lib/catalog";
import {
  featurePendingField,
  type DraftFlowAction,
  type FeatureInputPart,
  type PendingField,
} from "@/lib/create-plan/draft-reducer";
import type { StepIssue } from "@/lib/create-plan/steps";
import type { FeatureComparison } from "@/lib/derive/draft-flow";
import type { FeatureValue } from "@/lib/derive/types";
import { formatUnit, getCurrencySymbol } from "@/lib/format";

type FeatureFieldProps = {
  feature: CatalogFeature;
  configured: ReleaseFeature | undefined;
  comparison: FeatureComparison;
  pending: PendingField[];
  issues: StepIssue[];
  showAllIssues: boolean;
  currency: string;
  dispatch: Dispatch<DraftFlowAction>;
};

type LimitedCapacity = Extract<CapacityLimit, { type: "limited" }>;

const DEFAULT_LIMIT: LimitedCapacity = { type: "limited", includedAmount: 1, overage: { type: "blocked" } };

/** The value a feature takes when it is switched on: the nearest neighbour's, so the start is sensible. */
function neighbourValue(comparison: FeatureComparison, kind: FeatureValue["kind"]): FeatureValue | null {
  for (const neighbour of [comparison.below, comparison.above]) {
    if (neighbour?.value.kind === kind) return neighbour.value;
  }
  return null;
}

const radioClass = "size-4 shrink-0 accent-live";
const optionClass = "flex cursor-pointer items-center gap-2";

export function FeatureField({ feature, configured, comparison, pending, issues, showAllIssues, currency, dispatch }: FeatureFieldProps) {
  const code = feature.code;
  const fieldId = (part: FeatureInputPart) => `feature-${code}-${part}`;
  const isPending = (part: FeatureInputPart) => pending.includes(featurePendingField(code, part));
  const errorFor = (part: FeatureInputPart) =>
    showAllIssues ? issues.find((issue) => issue.field === fieldId(part))?.message : undefined;
  const invalid = (part: FeatureInputPart, isInvalid: boolean) =>
    dispatch({ type: "set_feature_input_invalid", code, part, invalid: isInvalid });
  const setFeature = (next: ReleaseFeature | null) => dispatch({ type: "set_feature", code, feature: next });

  const inputProps = (part: FeatureInputPart) => {
    const error = errorFor(part);
    return {
      id: fieldId(part),
      ...(error ? { "aria-invalid": true as const, "aria-describedby": `${fieldId(part)}-error` } : {}),
    };
  };
  const errors = (["credits", "amount", "unit_price"] as const).flatMap((part) => {
    const message = errorFor(part);
    return message ? [<FieldError key={part} id={`${fieldId(part)}-error`} message={message} />] : [];
  });

  let control;
  if (feature.type === "boolean") {
    const enabled = configured?.type === "boolean" && configured.enabled;
    control = (
      <label className={`${optionClass} w-fit`}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setFeature(event.target.checked ? { code, type: "boolean", enabled: true } : null)}
          className={radioClass}
        />
        Included
      </label>
    );
  } else if (feature.type === "credit") {
    const current = configured?.type === "credit" ? configured : null;
    const fallback = neighbourValue(comparison, "credit");
    control = (
      <div className="space-y-2">
        <label className={`${optionClass} w-fit`}>
          <input
            type="checkbox"
            checked={current !== null}
            onChange={(event) =>
              setFeature(
                event.target.checked
                  ? { code, type: "credit", creditsPerUnit: fallback?.kind === "credit" ? fallback.creditsPerUnit : 1 }
                  : null,
              )
            }
            className={radioClass}
          />
          Included
        </label>
        {current && (
          <div className="max-w-xs">
            <label htmlFor={fieldId("credits")} className="text-caption text-ink-muted">Cost of each {feature.unit}</label>
            <div className="mt-1">
              <AmountInput
                {...inputProps("credits")}
                kind="count"
                suffix={`credits / ${feature.unit}`}
                value={isPending("credits") ? null : current.creditsPerUnit}
                onValueChange={(credits) => {
                  if (credits === null) invalid("credits", true);
                  else {
                    setFeature({ code, type: "credit", creditsPerUnit: credits });
                    invalid("credits", false);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  } else {
    const limit = configured?.type === "capacity" ? configured.limit : null;
    const fallback = neighbourValue(comparison, "capacity");
    const fallbackLimit = fallback?.kind === "capacity" && fallback.limit.type === "limited" ? fallback.limit : DEFAULT_LIMIT;
    const setLimit = (next: CapacityLimit) => setFeature({ code, type: "capacity", limit: next });
    const mode = limit === null ? "none" : limit.type;
    const unitPlural = formatUnit(feature.unit, 2);

    control = (
      <div className="space-y-3">
        <div role="radiogroup" aria-label={`${feature.name} availability`} className="flex flex-wrap gap-x-4 gap-y-2">
          <label className={optionClass}>
            <input type="radio" name={`capacity-${code}`} checked={mode === "none"} onChange={() => setFeature(null)} className={radioClass} />
            Not included
          </label>
          <label className={optionClass}>
            <input
              type="radio"
              name={`capacity-${code}`}
              checked={mode === "limited"}
              onChange={() => setLimit(fallbackLimit)}
              className={radioClass}
            />
            Limited
          </label>
          <label className={optionClass}>
            <input
              type="radio"
              name={`capacity-${code}`}
              checked={mode === "unlimited"}
              onChange={() => setLimit({ type: "unlimited" })}
              className={radioClass}
            />
            Unlimited
          </label>
        </div>

        {limit?.type === "limited" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={fieldId("amount")} className="text-caption text-ink-muted">Included</label>
              <div className="mt-1">
                <AmountInput
                  {...inputProps("amount")}
                  kind="count"
                  suffix={unitPlural}
                  value={isPending("amount") ? null : limit.includedAmount}
                  onValueChange={(amount) => {
                    if (amount === null) invalid("amount", true);
                    else {
                      setLimit({ ...limit, includedAmount: amount });
                      invalid("amount", false);
                    }
                  }}
                />
              </div>
            </div>
            <fieldset>
              <legend className="text-caption text-ink-muted">Past the limit</legend>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className={optionClass}>
                  <input
                    type="radio"
                    name={`overage-${code}`}
                    checked={limit.overage.type === "blocked"}
                    onChange={() => setLimit({ ...limit, overage: { type: "blocked" } })}
                    className={radioClass}
                  />
                  Blocked
                </label>
                <label className={optionClass}>
                  <input
                    type="radio"
                    name={`overage-${code}`}
                    checked={limit.overage.type === "billed"}
                    onChange={() => {
                      const neighbourPrice = fallbackLimit.overage.type === "billed" ? fallbackLimit.overage.unitPrice : null;
                      setLimit({ ...limit, overage: { type: "billed", unitPrice: neighbourPrice ?? 0 } });
                      if (neighbourPrice === null) invalid("unit_price", true);
                    }}
                    className={radioClass}
                  />
                  Billed
                </label>
              </div>
              {limit.overage.type === "billed" && (
                <div className="mt-2">
                  <label htmlFor={fieldId("unit_price")} className="sr-only">Price per extra {feature.unit}</label>
                  <AmountInput
                    {...inputProps("unit_price")}
                    kind="money"
                    prefix={getCurrencySymbol(currency)}
                    suffix={`/ ${feature.unit}`}
                    value={isPending("unit_price") ? null : limit.overage.unitPrice}
                    onValueChange={(unitPrice) => {
                      if (unitPrice === null) invalid("unit_price", true);
                      else {
                        setLimit({ ...limit, overage: { type: "billed", unitPrice } });
                        invalid("unit_price", false);
                      }
                    }}
                  />
                </div>
              )}
            </fieldset>
          </div>
        )}
      </div>
    );
  }

  return (
    <li className="grid gap-x-6 gap-y-2 py-4 first:pt-3 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
      <div>
        <p className="font-medium">{feature.name}</p>
        {feature.type === "credit" && <p className="text-caption text-ink-muted">Spends credits per {feature.unit}</p>}
      </div>
      <div className="min-w-0 space-y-2">
        {control}
        {errors}
        <FeatureNeighbours feature={feature} comparison={comparison} currency={currency} />
      </div>
    </li>
  );
}
