"use client";

import type { ReactNode } from "react";
import { FeatureField } from "@/components/create-plan/feature-field";
import type { StepProps } from "@/components/create-plan/flow-data";
import { CoinsIcon } from "@/components/icons/coins-icon";
import { GaugeIcon } from "@/components/icons/gauge-icon";
import { KeyIcon } from "@/components/icons/key-icon";
import { WidgetHeader } from "@/components/ui/widget-header";
import { getFeatureComparisons } from "@/lib/derive/draft-flow";
import { groupFeaturesByType } from "@/lib/derive/plan-detail";

const GROUPS: { type: "credit" | "capacity" | "boolean"; title: string; description: string; icon: ReactNode }[] = [
  { type: "credit", title: "Credits", description: "What each action costs", icon: <CoinsIcon className="size-4 shrink-0 text-ink-muted" /> },
  { type: "capacity", title: "Capacity", description: "Included, then billed or blocked", icon: <GaugeIcon className="size-4 shrink-0 text-ink-muted" /> },
  { type: "boolean", title: "Access", description: "On or off", icon: <KeyIcon className="size-4 shrink-0 text-ink-muted" /> },
];

export function FeaturesStep({ state, dispatch, data, derived, issues, showAllIssues }: StepProps) {
  const { position, summary } = derived;
  const comparisons = getFeatureComparisons(summary.features, position);
  const groups = groupFeaturesByType(summary.features);
  const hasNeighbours = Boolean(position?.below || position?.above);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-ink-muted">
        Features are what a version includes. Unlike the price, a change to them only reaches customers who subscribe
        to the new version. Next to each one you see the plans around this one, so a pricier plan never gives less by
        accident.
      </p>
      {!hasNeighbours && <p className="text-caption text-ink-muted">No other plans to compare with yet.</p>}

      {GROUPS.map((group) => {
        const entries = groups[group.type];
        if (entries.length === 0) return null;
        const headingId = `features-${group.type}-heading`;
        return (
          <section key={group.type} aria-labelledby={headingId} className="overflow-hidden rounded-card border border-line">
            <WidgetHeader
              icon={group.icon}
              title={
                <h3 id={headingId} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{group.title}</span>
                  <span className="text-caption text-ink-muted">{group.description}</span>
                </h3>
              }
            />
            <ul className="divide-y divide-line bg-surface-card px-4">
              {entries.map(({ feature }) => (
                <FeatureField
                  key={feature.code}
                  feature={feature}
                  configured={state.draft.features.find((entry) => entry.code === feature.code)}
                  comparison={comparisons[feature.code] ?? { below: null, above: null }}
                  pending={state.pending}
                  issues={issues}
                  showAllIssues={showAllIssues}
                  currency={data.currency}
                  dispatch={dispatch}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
