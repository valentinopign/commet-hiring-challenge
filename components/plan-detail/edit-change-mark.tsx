import { ImpactLabel } from "@/components/plan-detail/impact-label";
import type { FeatureImpact } from "@/lib/derive/types";

/** Before/after text gives every change a cue independent of colour. */
export function EditChangeMark({ before, after, impact }: { before: string; after: string; impact: FeatureImpact | null }) {
  return <div className="mt-2 space-y-1 rounded-control border border-line-strong bg-surface-raised px-2.5 py-2 text-caption">
    <p className="break-words tabular-nums"><span className="sr-only">Changed from </span>{before}<span aria-hidden="true"> → </span><span className="sr-only"> to </span>{after}</p>
    {impact ? <ImpactLabel impact={impact} /> : <span className="text-ink-muted">Plan identity · no version change</span>}
  </div>;
}
