import type { VersionShare } from "@/lib/derive/types";

/**
 * Status words and the matching marker for a version. The marker repeats what the word says
 * (solid accent for current, stripes for retired, dashed for a draft), so it never stands alone.
 */
export function describeVersionStatus(version: VersionShare): { label: string; markerClass: string } {
  if (version.isCurrent) return { label: "Current", markerClass: "bg-live" };
  switch (version.status) {
    case "retired":
      return { label: "Retired", markerClass: "bg-retired-stripes" };
    case "building":
      return { label: "Draft", markerClass: "border border-dashed border-line-strong bg-surface-card" };
    case "published":
      // Published but not the current version: the catalog alerts report the mismatch.
      return { label: "Published", markerClass: "bg-ink-muted" };
  }
}
