import { ComparisonDifference } from "@/components/plan-detail/comparison-difference";
import { VersionSplitBar } from "@/components/plans/version-split-bar";
import type { PlanDetail } from "@/lib/derive/types";
import { formatNumber } from "@/lib/format";

type Props = { detail: PlanDetail; customerDelta?: number };

export function ComparisonCustomersValue({ detail, customerDelta = 0 }: Props) {
  return <>
    <p className="text-stat font-medium tabular-nums">{formatNumber(detail.plan.totalSubscriptions)}</p>
    <p className="text-caption text-ink-muted">{detail.plan.totalSubscriptions ? "Across all versions" : "No customers yet"}</p>
    <div className="mt-3"><VersionSplitBar versions={detail.plan.versionSplit} /></div>
    {customerDelta !== 0 && <p className="mt-2">
      <ComparisonDifference>{formatNumber(Math.abs(customerDelta))} {customerDelta > 0 ? "more" : "fewer"} customers</ComparisonDifference>
    </p>}
  </>;
}
