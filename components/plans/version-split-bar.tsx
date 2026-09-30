import type { VersionShare } from "@/lib/derive/types";

type VersionSplitBarProps = { versions: VersionShare[] };

/** Segment fill by status. Retired is striped so it doesn't depend on telling two greys apart. */
function swatchClass(version: VersionShare): string {
  if (version.isCurrent) return "bg-live";
  if (version.status === "building") return "border border-dashed border-line-strong bg-surface";
  return "bg-retired-stripes";
}

const describeShares = (versions: VersionShare[]) =>
  versions.map((version) => `v${version.version} ${version.percent}%`).join(", ");

/**
 * How a plan's customers are spread across versions. The bar is decorative; the legend
 * underneath says the same in text, so the bar is hidden from assistive technology.
 * The legend groups versions by status so it stays at two lines however many versions exist.
 */
export function VersionSplitBar({ versions }: VersionSplitBarProps) {
  const total = versions.reduce((sum, version) => sum + version.subscriptions, 0);

  if (total === 0) {
    return (
      <div>
        <div className="h-1.5 rounded-sm bg-line" aria-hidden="true" />
        <p className="mt-1 text-caption text-ink-muted">No customers</p>
      </div>
    );
  }

  if (versions.length === 1) {
    return (
      <div>
        <div className={`h-1.5 rounded-sm ${swatchClass(versions[0])}`} aria-hidden="true" />
        <p className="mt-1 text-caption text-ink-muted">All on v{versions[0].version}, the only version</p>
      </div>
    );
  }

  const current = versions.filter((version) => version.isCurrent);
  // Newest first: the most recent retired version is usually where the customers are.
  const retired = versions.filter((version) => version.status === "retired" && !version.isCurrent).reverse();
  const other = versions.filter((version) => version.status !== "retired" && !version.isCurrent);

  const groups = [
    { key: "current", label: "current", swatch: "bg-live", shares: current },
    { key: "retired", label: "retired", swatch: "bg-retired-stripes", shares: retired },
    { key: "other", label: "not current", swatch: "border border-dashed border-line-strong bg-surface", shares: other },
  ].filter((group) => group.shares.length > 0);

  return (
    <div>
      <div className="flex h-1.5 gap-px overflow-hidden rounded-sm" aria-hidden="true">
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
      <ul className="mt-1 text-caption text-ink-muted">
        {groups.map((group) => (
          <li key={group.key} className="flex items-center gap-1.5">
            <span className={`size-2 shrink-0 rounded-sm ${group.swatch}`} aria-hidden="true" />
            <span className={group.key === "current" ? "text-ink" : undefined}>
              {group.label}: {describeShares(group.shares)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
