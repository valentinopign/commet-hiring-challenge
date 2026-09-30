"use client";

import type { ReactNode } from "react";
import { DraftWarningList } from "@/components/create-plan/draft-warning-list";
import type { StepProps } from "@/components/create-plan/flow-data";
import { ReviewSection } from "@/components/create-plan/review-section";
import { CheckIcon } from "@/components/icons/check-icon";
import type { StepId } from "@/lib/create-plan/steps";
import { isFeatureAvailable } from "@/lib/derive/compare-features";
import { groupWarningsBySeverity } from "@/lib/derive/draft-flow";
import { groupFeaturesByType } from "@/lib/derive/plan-detail";
import type { PeriodPricing } from "@/lib/derive/types";
import { formatCredits, formatFeatureValue, formatMoney, formatNumber } from "@/lib/format";

type ReviewStepProps = StepProps & { onGoToStep: (step: StepId) => void };

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-0.5 py-1.5 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <dt className="text-ink-muted">{term}</dt>
      <dd className="min-w-0 tabular-nums">{children}</dd>
    </div>
  );
}

function describePeriod(period: PeriodPricing, unit: "mo" | "yr", currency: string): string {
  const perThousand = period.pricePerThousandCredits === null
    ? ""
    : ` · ${formatMoney(period.pricePerThousandCredits, currency)} / 1,000`;
  return `${formatMoney(period.price, currency)} / ${unit} · ${formatCredits(period.includedCredits)}${perThousand}`;
}

const FEATURE_GROUPS = [
  { type: "credit", title: "Credits" },
  { type: "capacity", title: "Capacity" },
  { type: "boolean", title: "Access" },
] as const;

const WARNING_GROUPS = [
  { severity: "blocking", title: "Must fix before publishing" },
  { severity: "warning", title: "Worth a second look" },
  { severity: "info", title: "Good to know" },
] as const;

export function ReviewStep({ state, data, derived, onGoToStep }: ReviewStepProps) {
  const { draft } = state;
  const { summary, warnings } = derived;
  const { currency, planNames, bases, packs } = data;
  const selectedPacks = packs.filter((pack) => derived.draft.creditPackCodes.includes(pack.code));
  const base = bases.find((candidate) => candidate.code === draft.basePlanCode);
  const features = groupFeaturesByType(summary.features);
  const groups = groupWarningsBySeverity(warnings);
  const policy = summary.exhaustionPolicy;

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-ink-muted">
        Everything this plan will be, and what to look at before publishing it.
      </p>

      <section aria-labelledby="checks-heading" className="space-y-3">
        <h3 id="checks-heading" className="font-medium">Checks</h3>
        {warnings.length === 0 ? (
          <p className="flex items-center gap-2 text-ink-muted">
            <CheckIcon className="size-4 shrink-0 text-live" />
            No issues found. The plan fits between the plans around it.
          </p>
        ) : (
          WARNING_GROUPS.map((group) =>
            groups[group.severity].length > 0 ? (
              <div key={group.severity} className="space-y-2">
                <h4 className="text-caption font-medium text-ink-muted">{group.title}</h4>
                <DraftWarningList
                  warnings={groups[group.severity]}
                  planNames={planNames}
                  currency={currency}
                  label={group.title}
                  onGoToStep={onGoToStep}
                />
              </div>
            ) : null,
          )
        )}
      </section>

      <ReviewSection id="review-position" title="Position" onEdit={() => onGoToStep("position")}>
        <dl>
          <Row term="Name">{draft.name}</Row>
          <Row term="Code"><span className="font-mono">{draft.code}</span></Row>
          <Row term="Visibility">{draft.isPublic ? "Public" : "Private"}</Row>
          <Row term="Started from">{base ? `${base.name} v${base.currentReleaseVersion}` : "Scratch"}</Row>
        </dl>
      </ReviewSection>

      <ReviewSection id="review-price" title="Price and credits" onEdit={() => onGoToStep("price")}>
        <dl>
          <Row term="Monthly">
            {draft.pricing.type === "free"
              ? `Free · ${formatCredits(draft.pricing.includedCredits)} / mo`
              : summary.monthly && describePeriod(summary.monthly, "mo", currency)}
          </Row>
          <Row term="Yearly">{summary.yearly ? describePeriod(summary.yearly, "yr", currency) : "Not offered"}</Row>
        </dl>
      </ReviewSection>

      <ReviewSection id="review-policy" title="When credits run out" onEdit={() => onGoToStep("credits-run-out")}>
        <dl>
          <Row term="Policy">
            {policy.type === "block"
              ? "Stop the service until credits renew or the customer upgrades."
              : `Bill the extra at ${formatMoney(policy.pricePer1000Credits, currency)} per 1,000 credits.`}
          </Row>
          <Row term="Credit packs">
            {selectedPacks.length > 0 ? (
              <>
                {selectedPacks
                  .map((pack) => `${formatNumber(pack.credits)} credits (${formatMoney(pack.price, currency)})`)
                  .join(", ")}
                <span className="block text-caption text-ink-muted">Publishing adds this plan to these packs.</span>
              </>
            ) : policy.type === "block" ? (
              "None. When credits run out, upgrading is the only way to keep going."
            ) : (
              "None."
            )}
          </Row>
        </dl>
      </ReviewSection>

      <ReviewSection id="review-features" title="Features" onEdit={() => onGoToStep("features")}>
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURE_GROUPS.map((group) => {
            const entries = features[group.type];
            const included = entries.filter((entry) => isFeatureAvailable(entry.value));
            const missing = entries.filter((entry) => !isFeatureAvailable(entry.value));
            return (
              <div key={group.type}>
                <h4 className="text-caption font-medium text-ink-muted">{group.title}</h4>
                <dl className="mt-1">
                  {included.map((entry) => (
                    <div key={entry.feature.code} className="py-1">
                      <dt className="font-medium">{entry.feature.name}</dt>
                      <dd className="text-caption text-ink-muted tabular-nums">{formatFeatureValue(entry, currency)}</dd>
                    </div>
                  ))}
                </dl>
                {included.length === 0 && <p className="py-1 text-ink-muted">None included</p>}
                {missing.length > 0 && (
                  <p className="mt-1 text-caption text-ink-muted">
                    Not included: {missing.map((entry) => entry.feature.name).join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </ReviewSection>

      <section aria-labelledby="reach-heading" className="rounded-card border border-line bg-surface-card px-4 py-3">
        <h3 id="reach-heading" className="font-medium">Who this reaches</h3>
        <p className="mt-1 text-ink-muted">
          A new plan has no customers yet: once published, it only reaches customers who subscribe to it. Later, a
          change to its price, credits or what happens when they run out would reach all of them at renewal; a change
          to its features would be a new version, for new customers only.
        </p>
      </section>
    </div>
  );
}
