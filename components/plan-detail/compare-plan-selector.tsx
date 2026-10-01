import Link from "@/components/organizations/catalog-link";
import { DiffIcon } from "@/components/icons/diff-icon";
import { OpenComparisonIcon } from "@/components/icons/open-comparison-icon";
import { ComparisonSelectionTransition } from "@/components/plan-detail/comparison-selection-transition";
import { outlineControlClass, outlineIconControlClass } from "@/components/ui/control-styles";
import { planComparisonHref, type ComparisonOption } from "@/lib/derive/compare-plans";
import styles from "./compare-plan-selector.module.css";

type Props = { planCode: string; viewedVersion: number; options: ComparisonOption[]; onlyDifferences?: boolean; label?: string; id?: string; selectedCompare?: string; lateralTrigger?: boolean };

/** Native dismissal and focus behaviour; links are the complete, shareable selection. */
export function ComparePlanSelector({ planCode, viewedVersion, options, onlyDifferences = false, label = "Compare", id = "compare-plan", selectedCompare, lateralTrigger = false }: Props) {
  return <>
    <button type="button" popoverTarget={id} disabled={options.length === 0} className={`${outlineIconControlClass} min-h-11 disabled:opacity-40`}>
      <DiffIcon />{label}
    </button>
    {lateralTrigger && <button type="button" popoverTarget={id} aria-label="Open comparison selector" title="Open comparison selector" className="fixed top-topbar right-0 bottom-[var(--comparison-bar-height,9rem)] z-30 inline-flex min-h-11 w-11 items-center justify-center border-l border-line-strong bg-surface-raised text-ink-muted transition-colors hover:bg-surface-card hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2">
      <OpenComparisonIcon />
    </button>}
    <div id={id} popover="auto" role="dialog" aria-labelledby={`${id}-heading`} className={`${styles.drawer} fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-none overflow-y-auto border-0 bg-surface-card p-0 text-ink sm:w-[min(44rem,100vw)] sm:border-l sm:border-line`}>
      <ComparisonSelectionTransition>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface-card px-5 py-4">
          <h2 id={`${id}-heading`} className="text-lg font-semibold">Compare plans or versions</h2>
          <button type="button" popoverTarget={id} popoverTargetAction="hide" autoFocus aria-label="Close comparison selector" className={`${outlineControlClass} min-h-11`}>Close</button>
        </div>
        <div className="space-y-6 px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <p className="text-caption text-ink-muted">Choose another version of this plan or compare with a different plan.</p>
          <ul className="divide-y divide-line">
          {options.map((option) => <li key={option.code} className="py-3 first:pt-0 last:pb-0">
            <Link href={planComparisonHref(planCode, { version: viewedVersion, compare: `${option.code}.${option.defaultVersion}`, onlyDifferences })} scroll={false} className="flex min-h-11 items-center justify-between gap-3 rounded-control px-3 py-2 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2">
              <span className="font-medium">{option.name}{option.isSamePlan && <span className="ml-2 text-caption text-ink-muted">Other versions</span>}{!option.isPublic && <span className="ml-2 text-caption text-ink-muted">Private</span>}</span>
              <span className="text-caption text-ink-muted">v{option.defaultVersion} · {option.versions.find((entry) => entry.version === option.defaultVersion)?.isCurrent ? "Current" : option.versions.find((entry) => entry.version === option.defaultVersion)?.status === "building" ? "Draft" : "Retired"}</span>
            </Link>
            <ul aria-label={`${option.name} versions`} className="mt-1 flex flex-wrap gap-2 px-3">
              {option.versions.map((entry) => <li key={entry.version}><Link href={planComparisonHref(planCode, { version: viewedVersion, compare: `${option.code}.${entry.version}`, onlyDifferences })} scroll={false} aria-current={selectedCompare === `${option.code}.${entry.version}` ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-1.5 rounded-control border px-3 py-2 text-caption hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 ${selectedCompare === `${option.code}.${entry.version}` ? "border-live bg-live-soft font-semibold" : "border-line"}`}>
                v{entry.version}<span className="text-ink-muted">{entry.isCurrent ? "Current" : entry.status === "building" ? "Draft" : "Retired"}</span>
              </Link></li>)}
            </ul>
          </li>)}
          </ul>
        </div>
      </ComparisonSelectionTransition>
    </div>
  </>;
}
