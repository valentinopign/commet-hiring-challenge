import type { VersionShare } from "@/lib/derive/types";

type VersionSplitBarProps = { versions: VersionShare[]; showPercentages?: boolean };

/** Segment fill by status. Retired is striped so it doesn't depend on telling two greys apart. */
function swatchClass(version: VersionShare): string {
  if (version.isCurrent) return "bg-live";
  if (version.status === "building") return "border border-dashed border-line-strong bg-surface";
  return "bg-retired-stripes";
}

/**
 * Compact bar and per-version percentages, with a complete screen-reader summary.
 */
export function VersionSplitBar({ versions, showPercentages = true }: VersionSplitBarProps) {
  const total = versions.reduce((sum, version) => sum + version.subscriptions, 0);

  if (total === 0) {
    return (
      <div>
        <div className="h-1.5 rounded-mark bg-line" aria-hidden="true" />
        <p className="sr-only">No customers</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-1.5 gap-px overflow-hidden rounded-mark" aria-hidden="true">
        {versions
          .filter((version) => version.subscriptions > 0)
          .map((version) => (
            <div
              key={version.version}
              className={swatchClass(version)}
              style={{ width: `${version.share * 100}%` }}
            />
          ))}
      </div>
      {showPercentages && <p aria-hidden="true" className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-caption text-ink-muted tabular-nums">
        {versions.map((version, index) => <span key={version.version} className="whitespace-nowrap">
          {index > 0 && <span className="me-2">·</span>}
          <span className={version.isCurrent ? "text-ink" : undefined}>v{version.version} {version.subscriptions > 0 && version.percent === 0 ? "<1%" : `${version.percent}%`}</span>
        </span>)}
      </p>}
      <p className="sr-only">Customers by version: {versions.map((version) => `v${version.version}, ${version.isCurrent ? "current" : version.status}, ${version.subscriptions} customers (${version.percent}%)`).join("; ")}.</p>
    </div>
  );
}
