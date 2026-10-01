import Link from "@/components/organizations/catalog-link";
import type { TimelineEntry } from "@/lib/derive/types";
import { planComparisonHref } from "@/lib/derive/compare-plans";

type VersionSwitcherProps = {
  planCode: string;
  timeline: TimelineEntry[];
  viewedVersion: number;
  comparisonQuery?: { compare: string; onlyDifferences: boolean };
};

/**
 * Plain links to `?version=N`, so the page stays a Server Component and a version can be shared
 * by URL. `scroll={false}` keeps the reader at the features instead of jumping to the top.
 */
export function VersionSwitcher({ planCode, timeline, viewedVersion, comparisonQuery }: VersionSwitcherProps) {
  if (timeline.length < 2) return null;

  return (
    <nav aria-label="Feature version" className="mb-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-ink">View version</span>
      <ul className="flex flex-wrap gap-2">
        {[...timeline].reverse().map((entry) => {
          const isViewed = entry.version === viewedVersion;
          return (
            <li key={entry.version}>
              <Link
                href={comparisonQuery ? planComparisonHref(planCode, { version: entry.version, ...comparisonQuery }) : { pathname: `/plans/${planCode}`, query: { version: entry.version } }}
                scroll={false}
                aria-current={isViewed ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 py-2 text-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isViewed ? "border-live bg-live-soft font-semibold text-ink" : "border-line bg-surface-raised text-ink-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                v{entry.version}
                {entry.isCurrent && <span className="text-caption font-normal">Current</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
