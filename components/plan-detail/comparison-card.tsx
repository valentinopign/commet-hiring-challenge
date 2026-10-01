import type { ReactNode } from "react";

type Props = { title: string; icon: ReactNode; leftLabel: string; rightLabel: string; left: ReactNode; right: ReactNode };

/** One definition with two labelled values; the left value is always first on phones. */
export function ComparisonCard({ title, icon, leftLabel, rightLabel, left, right }: Props) {
  return <div data-comparison-card className="flex flex-col overflow-hidden rounded-card border border-line">
    <dt className="flex shrink-0 items-center gap-2 border-b border-line bg-surface-raised px-4 py-2 text-caption text-ink-muted">{icon}{title}</dt>
    <dd className="grid flex-1 grid-cols-1 divide-y divide-line bg-surface-card sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      <div className="min-w-0 p-4"><p className="mb-2 text-sm font-semibold text-ink sm:text-caption sm:font-medium sm:text-ink-muted">{leftLabel}</p>{left}</div>
      <div data-comparison-value className="min-w-0 p-4"><p className="mb-2 text-sm font-semibold text-ink sm:text-caption sm:font-medium sm:text-ink-muted">{rightLabel}</p>{right}</div>
    </dd>
  </div>;
}
