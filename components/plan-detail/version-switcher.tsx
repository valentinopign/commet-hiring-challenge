import Link from "@/components/organizations/catalog-link";
import type { TimelineEntry } from "@/lib/derive/types";

type VersionSwitcherProps = {
  planCode: string;
  timeline: TimelineEntry[];
  viewedVersion: number;
};

/**
 * Plain links to `?version=N`, so the page stays a Server Component and a version can be shared
 * by URL. `scroll={false}` keeps the reader at the features instead of jumping to the top.
 */
export function VersionSwitcher({ planCode, timeline, viewedVersion }: VersionSwitcherProps) {
  if (timeline.length < 2) return null;

  return (
    <nav aria-label="Feature version">
      <ul className="inline-flex rounded-control border border-line bg-surface-card p-0.5">
        {[...timeline].reverse().map((entry) => {
          const isViewed = entry.version === viewedVersion;
          return (
            <li key={entry.version}>
              <Link
                href={{ pathname: `/plans/${planCode}`, query: { version: entry.version } }}
                scroll={false}
                aria-current={isViewed ? "page" : undefined}
                className={`inline-flex items-center gap-1 rounded-[calc(var(--radius-control)-2px)] px-2.5 py-1 text-caption tabular-nums transition-colors ${
                  isViewed ? "bg-surface-raised font-medium text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                v{entry.version}
                {entry.isCurrent && <span className="text-ink-muted">· current</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
