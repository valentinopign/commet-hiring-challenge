import { DiffIcon } from "@/components/icons/diff-icon";
import { FeatureChangeRow } from "@/components/plan-detail/feature-change-row";
import { WidgetHeader } from "@/components/ui/widget-header";
import type { TimelineEntry } from "@/lib/derive/types";
import { formatDate } from "@/lib/format";

type VersionChangesProps = { timeline: TimelineEntry[]; currency: string };

/** One block per pair of consecutive versions, newest pair first. */
export function VersionChanges({ timeline, currency }: VersionChangesProps) {
  const transitions = timeline
    .flatMap((entry, index) => {
      const previous = timeline[index - 1];
      return previous ? [{ entry, previous }] : [];
    })
    .reverse();

  return (
    <section aria-labelledby="changes-heading" className="flex flex-col overflow-hidden rounded-card border border-line">
      <WidgetHeader
        icon={<DiffIcon className="size-4 shrink-0 text-ink-muted" />}
        title={<h3 id="changes-heading" className="font-medium">Changes between versions</h3>}
      />
      <div className="flex-1 bg-surface-card px-4 py-3">
        {transitions.length === 0 ? (
          <p className="py-1 text-ink-muted">Only one version so far, so there is nothing to compare yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {transitions.map(({ entry, previous }) => (
              <div key={entry.version} className="py-2 first:pt-0 last:pb-0">
                <h4 className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">
                    v{previous.version} → v{entry.version}
                  </span>
                  <span className="text-caption text-ink-muted">{formatDate(entry.publishedAt)}</span>
                </h4>
                {entry.changesFromPrevious === null || entry.changesFromPrevious.length === 0 ? (
                  <p className="py-2 text-ink-muted">No feature changes.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {entry.changesFromPrevious.map((change) => (
                      <FeatureChangeRow key={change.feature.code} change={change} currency={currency} />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
