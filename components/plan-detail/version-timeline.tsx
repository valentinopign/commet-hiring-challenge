import { ClockIcon } from "@/components/icons/clock-icon";
import { describeVersionStatus } from "@/components/plan-detail/version-status";
import { WidgetHeader } from "@/components/ui/widget-header";
import type { TimelineEntry } from "@/lib/derive/types";
import { formatDate, formatCount, formatNumber } from "@/lib/format";
import type { ScheduledMigration } from "@/lib/edit-plan/publication";
import { MigrationEntryLink } from "./migration-entry-link";

type VersionTimelineProps = { timeline: TimelineEntry[]; schedules?: readonly ScheduledMigration[]; planCode?: string };

function describeCustomers(entry: TimelineEntry): string {
  if (entry.subscriptions === 0) return "No customers";
  const customers = `${formatNumber(entry.subscriptions)} ${entry.subscriptions === 1 ? "customer" : "customers"}`;
  return `${customers} · ${entry.percent}%`;
}

/** Newest first: the version new customers get today is what the team asks about most. */
export function VersionTimeline({ timeline, schedules = [], planCode }: VersionTimelineProps) {
  const newestFirst = [...timeline].reverse();
  const currentVersion = timeline.find((entry) => entry.isCurrent && entry.status === "published")?.version;

  return (
    <section aria-labelledby="timeline-heading" className="flex flex-col overflow-hidden rounded-card border border-line">
      <WidgetHeader
        icon={<ClockIcon className="size-4 shrink-0 text-ink-muted" />}
        title={<h3 id="timeline-heading" className="font-medium">Timeline</h3>}
      />
      <div className="flex-1 bg-surface-card px-4 py-4">
        {/* The rail is decoration; order and status are in the text of each item. */}
        <ol className="relative ml-1 border-l border-line">
          {newestFirst.map((entry) => {
            const status = describeVersionStatus(entry);
            return (
              <li key={entry.version} className="relative pb-4 pl-5 last:pb-0">
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 -left-[5.5px] size-2.5 rounded-full ring-4 ring-surface-card ${status.markerClass}`}
                />
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">v{entry.version}</span>
                  <span className={entry.isCurrent ? "text-live-ink" : "text-ink-muted"}>{status.label}</span>
                </p>
                <p className="text-caption text-ink-muted">
                  Published {formatDate(entry.publishedAt)}
                  {entry.replacedAt && <> · replaced {formatDate(entry.replacedAt)}</>}
                </p>
                <p className="mt-0.5 tabular-nums">{describeCustomers(entry)}</p>
                {schedules.filter((item) => item.fromVersion === entry.version).map((item) => <p key={item.toVersion} className="mt-1 text-caption font-medium text-info">{formatCount(item.customers, "customer")} scheduled to move to v{item.toVersion} at renewal.</p>)}
                {entry.isCurrent && (
                  <p className="text-caption text-ink-muted">New customers get this version.</p>
                )}
                {planCode && currentVersion !== undefined && entry.status === "retired" && entry.subscriptions > 0 && entry.version < currentVersion && !schedules.some((item) => item.fromVersion === entry.version) && <MigrationEntryLink planCode={planCode} currentVersion={currentVersion} sourceVersion={entry.version} />}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
