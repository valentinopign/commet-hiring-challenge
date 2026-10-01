"use client";

import { outlineControlClass, primaryControlClass } from "@/components/ui/control-styles";
import type { PlanChanges } from "@/lib/edit-plan/changes";
import { formatNumber } from "@/lib/format";
import { useLayoutEffect, useRef, type ReactNode, type MouseEvent } from "react";

export function PlanEditBar({ changes, migrationCount = 0, migrationCustomers = 0, targetVersion, migrationAction, onDiscard, onReview, invalid, onHeightChange }: { changes: PlanChanges; migrationCount?: number; migrationCustomers?: number; targetVersion?: number; migrationAction?: ReactNode; onDiscard: (event: MouseEvent<HTMLButtonElement>) => void; onReview: (event: MouseEvent<HTMLButtonElement>) => void; invalid: boolean; onHeightChange: (height: number) => void }) {
  const changeCount = changes.changeCount + migrationCount;
  const bar = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = bar.current;
    if (!element) return;
    const measure = () => onHeightChange(element.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeightChange]);
  return <div ref={bar} className="plan-edit-bar fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-surface-raised px-4 pt-3 text-sm sm:px-6 lg:left-sidebar" aria-label="Plan edit actions">
    <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 space-y-1" role="status" aria-live="polite" aria-atomic="true">
        <p className="font-medium">{changeCount} {changeCount === 1 ? "change" : "changes"}</p>
        <p className="text-caption text-ink-muted">{changes.createsVersion ? `New customers receive v${changes.nextVersion}. Migration is optional.` : "No new feature version."}</p>
        {changes.affectsAllCustomers && <p className="text-caption font-medium">All {formatNumber(changes.affectedCustomers)} customers across all versions · next renewal</p>}
        {migrationCount > 0 && <p className="text-caption font-medium">{formatNumber(migrationCustomers)} customers scheduled to move to v{targetVersion} at renewal</p>}
        {invalid && <p className="text-caption text-critical">Complete the highlighted fields before reviewing.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={`${outlineControlClass} min-h-11`} onClick={onDiscard}>Discard</button>
        {migrationAction}
        <button type="button" className={`${primaryControlClass} min-h-11 disabled:cursor-not-allowed disabled:opacity-40`} disabled={invalid || changeCount === 0} onClick={onReview}>Review &amp; publish</button>
      </div>
    </div>
  </div>;
}
