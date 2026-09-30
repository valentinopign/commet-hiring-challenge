import { ImpactLabel } from "@/components/plan-detail/impact-label";
import type { FeatureChange, FeatureChangeKind } from "@/lib/derive/types";
import { formatFeatureTransition } from "@/lib/format";

const KIND_LABEL: Record<FeatureChangeKind, string> = {
  added: "Added",
  removed: "Removed",
  changed: "Changed",
};

type FeatureChangeRowProps = { change: FeatureChange; currency: string };

export function FeatureChangeRow({ change, currency }: FeatureChangeRowProps) {
  return (
    <li className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-3">
      <div className="min-w-0">
        <p>
          <span className="mr-2 inline-block rounded-mark border border-line px-1.5 text-xs font-medium text-ink-muted">
            {KIND_LABEL[change.kind]}
          </span>
          <span className="font-medium">{change.feature.name}</span>
        </p>
        <p className="text-caption text-ink-muted tabular-nums">
          {formatFeatureTransition(change.feature, change.before, change.after, currency)}
        </p>
      </div>
      <ImpactLabel impact={change.impact} />
    </li>
  );
}
