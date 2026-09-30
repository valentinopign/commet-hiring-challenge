import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  /** Real context for the number, never a trend: there is no historical data. */
  detail: ReactNode;
  /** An alert about this very number, kept inside the card instead of above the page. */
  note?: ReactNode;
};

/** One term of the summary <dl>: the label is the card's header strip, the value its body. */
export function StatCard({ icon, label, value, detail, note }: StatCardProps) {
  return (
    <div className="overflow-hidden rounded-card border border-line">
      <dt className="flex items-center gap-2 border-b border-line bg-surface-raised px-3.5 py-2 text-caption text-ink-muted">
        {icon}
        {label}
      </dt>
      <dd className="bg-surface-card px-3.5 pt-2.5 pb-3">
        <span className="block text-stat font-medium tabular-nums">{value}</span>
        <span className="block text-caption text-ink-muted">{detail}</span>
        {note}
      </dd>
    </div>
  );
}
