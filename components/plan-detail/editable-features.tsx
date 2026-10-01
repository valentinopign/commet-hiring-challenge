"use client";

import type { Dispatch } from "react";
import { FeatureControl } from "@/components/create-plan/feature-control";
import { FeatureNeighbours } from "@/components/create-plan/feature-neighbours";
import { EditChangeMark } from "@/components/plan-detail/edit-change-mark";
import { ImpactLabel } from "@/components/plan-detail/impact-label";
import { WidgetHeader } from "@/components/ui/widget-header";
import { PageSection } from "@/components/page-section";
import type { DraftFlowAction, DraftFlowState } from "@/lib/create-plan/draft-reducer";
import type { StepIssue } from "@/lib/create-plan/steps";
import type { FeatureComparison } from "@/lib/derive/draft-flow";
import type { FeatureValue } from "@/lib/derive/types";
import { getCapacityCellChanges, type PlanChanges } from "@/lib/edit-plan/changes";
import type { CatalogFeature } from "@/lib/catalog";
import { formatCapacityIncluded, formatCapacityOverage, formatFeatureValue } from "@/lib/format";

type Props = { features: CatalogFeature[]; state: DraftFlowState; dispatch: Dispatch<DraftFlowAction>; changes: PlanChanges; comparisons: Record<string, FeatureComparison>; currency: string; currentVersion: number; issues: StepIssue[] };
const groups = [
  { type: "credit", title: "Credits", columns: ["Feature", "Cost"] },
  { type: "capacity", title: "Capacity", columns: ["Feature", "Included", "Past the limit"] },
  { type: "boolean", title: "Access", columns: ["Feature", "Availability"] },
] as const;

export function EditableFeatures({ features, state, dispatch, changes, comparisons, currency, currentVersion, issues }: Props) {
  return <PageSection id="features" title="Features">
    <p className="mb-3 text-caption text-ink-muted">Editing current v{currentVersion}. Feature changes publish v{changes.nextVersion} for new customers only; existing customers keep their version.</p>
    <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-2">
      {groups.map((group) => <section key={group.type} aria-labelledby={`features-${group.type}-heading`} className={`overflow-hidden rounded-card border border-line ${group.type === "capacity" ? "xl:col-span-2 xl:row-start-2" : ""}`}>
        <WidgetHeader title={<h3 id={`features-${group.type}-heading`} className="font-medium">{group.title}</h3>} />
        <div className="overflow-x-auto bg-surface-card px-4 py-2">
          {features.some((feature) => feature.type === group.type) ? <table className={`w-full text-left ${group.type === "capacity" ? "min-w-[28rem]" : ""}`}>
            <caption className="sr-only">Edit {group.title.toLowerCase()} on current v{currentVersion}</caption>
            <thead><tr className="text-caption text-ink-muted">{group.columns.map((column) => <th key={column} scope="col" className="px-2 py-2 font-normal first:pl-0">{column}</th>)}</tr></thead>
            <tbody className="divide-y divide-line border-t border-line">
              {features.filter((feature) => feature.type === group.type).map((feature) => {
                const change = changes.featureChanges.find((entry) => entry.feature.code === feature.code);
                const comparison = comparisons[feature.code] ?? { below: null, above: null };
                const controls = { feature, configured: state.draft.features.find((entry) => entry.code === feature.code), comparison, pending: state.pending, issues, showAllIssues: true, currency, dispatch };
                const cells = getCapacityCellChanges(change);
                const capacityText = (value: FeatureValue, part: "included" | "overage") => {
                  if (value.kind !== "capacity") return part === "included" ? "Not included" : "Not applicable";
                  const unit = feature.type === "capacity" ? feature.unit : "unit";
                  return part === "included" ? formatCapacityIncluded(value.limit, unit) : formatCapacityOverage(value.limit, unit, currency) ?? "Not applicable";
                };
                return <tr key={feature.code} className="align-top">
                  <th scope="row" className="w-1/3 py-3 pr-3 font-normal sm:w-1/4">
                    <span className="font-medium">{feature.name}</span>
                    {feature.type === "credit" && <span className="block text-caption text-ink-muted">per {feature.unit}</span>}
                    {change?.impact === "neutral" && feature.type === "capacity" && <div className="mt-2"><ImpactLabel impact="neutral" /></div>}
                  </th>
                  {feature.type === "capacity" ? <>
                    <td className="min-w-0 px-2 py-3">
                      <FeatureControl {...controls} part="included" />
                      {cells.included && <EditChangeMark before={capacityText(cells.included.before, "included")} after={capacityText(cells.included.after, "included")} impact={cells.included.impact} />}
                    </td>
                    <td className="min-w-0 px-2 py-3">
                      <FeatureControl {...controls} part="overage" />
                      {controls.configured?.type !== "capacity" || controls.configured.limit.type === "unlimited" ? <p className="text-caption text-ink-muted">Not applicable</p> : null}
                      {cells.overage && <EditChangeMark before={capacityText(cells.overage.before, "overage")} after={capacityText(cells.overage.after, "overage")} impact={cells.overage.impact} />}
                      <div className="mt-2"><FeatureNeighbours feature={feature} comparison={comparison} currency={currency} /></div>
                    </td>
                  </> : <td className="min-w-0 px-2 py-3">
                    <FeatureControl {...controls} />
                    {change && <EditChangeMark before={formatFeatureValue({ feature, value: change.before }, currency)} after={formatFeatureValue({ feature, value: change.after }, currency)} impact={change.impact} />}
                    <div className="mt-2"><FeatureNeighbours feature={feature} comparison={comparison} currency={currency} /></div>
                  </td>}
                </tr>;
              })}
            </tbody>
          </table> : <p className="py-2 text-caption text-ink-muted">No {group.title.toLowerCase()} features in the catalog.</p>}
        </div>
      </section>)}
    </div>
  </PageSection>;
}
