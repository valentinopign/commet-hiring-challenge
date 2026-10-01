"use client";

import { FeatureControl, type FeatureControlProps } from "@/components/create-plan/feature-control";
import { FeatureNeighbours } from "@/components/create-plan/feature-neighbours";

/** Creation owns the list layout; the same controls fit the plan detail table cells. */
export function FeatureField(props: FeatureControlProps) {
  const { feature, comparison, currency } = props;
  return (
    <li className="grid gap-x-6 gap-y-2 py-4 first:pt-3 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
      <div>
        <p className="font-medium">{feature.name}</p>
        {feature.type === "credit" && <p className="text-caption text-ink-muted">Spends credits per {feature.unit}</p>}
      </div>
      <div className="min-w-0 space-y-2">
        <FeatureControl {...props} />
        <FeatureNeighbours feature={feature} comparison={comparison} currency={currency} />
      </div>
    </li>
  );
}
