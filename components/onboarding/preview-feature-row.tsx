"use client";

import { useLayoutEffect, useRef } from "react";
import type { CatalogFeature } from "@/lib/catalog";
import { emphasizedEasing, prefersReducedMotion } from "@/components/ui/motion";

const TYPE_LABELS = { credit: "Uses credits", capacity: "Capacity", boolean: "Included or not" };

/** A feature unfolds into the preview; removing it closes the same small region. */
export function PreviewFeatureRow({ feature, onRemove }: { feature: CatalogFeature; onRemove?: (code: string) => void }) {
  const rowRef = useRef<HTMLLIElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const removing = useRef(false);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const reduced = prefersReducedMotion();
    row.style.overflow = "hidden";
    const animation = row.animate(reduced ? [{ opacity: 0 }, { opacity: 1 }] : [
      { height: "0px", opacity: 0, transform: "translateY(6px)" },
      { height: `${row.offsetHeight}px`, opacity: 1, transform: "translateY(0)" },
    ], { duration: reduced ? 150 : 280, easing: emphasizedEasing() });
    animationRef.current = animation;
    void animation.finished.then(() => { row.style.overflow = ""; }).catch(() => {});
    return () => animationRef.current?.cancel();
  }, []);

  function remove() {
    const row = rowRef.current;
    if (!row || !onRemove || removing.current) return;
    removing.current = true;
    const height = row.getBoundingClientRect().height;
    const opacity = getComputedStyle(row).opacity;
    const shouldRestoreFocus = row.contains(document.activeElement);
    const preview = row.closest<HTMLElement>("section[aria-labelledby='dashboard-preview-title']");
    const neighborButton = row.nextElementSibling?.querySelector<HTMLButtonElement>("button")
      ?? row.previousElementSibling?.querySelector<HTMLButtonElement>("button");
    animationRef.current?.cancel();
    row.style.overflow = "hidden";
    const reduced = prefersReducedMotion();
    const animation = row.animate(reduced ? [{ opacity }, { opacity: 0 }] : [
      { height: `${height}px`, opacity }, { height: "0px", opacity: 0 },
    ], { duration: reduced ? 120 : 200, easing: emphasizedEasing(), fill: "forwards" });
    animationRef.current = animation;
    void animation.finished.then(() => {
      onRemove(feature.code);
      if (shouldRestoreFocus) requestAnimationFrame(() => {
        const target = neighborButton?.isConnected ? neighborButton : preview?.querySelector<HTMLButtonElement>("button");
        target?.focus({ preventScroll: true });
      });
    }).catch(() => {});
  }

  return (
    <li ref={rowRef} className="relative">
      <div className="mb-2 flex items-center gap-3 rounded-control border border-onboarding-muted/20 py-2 pr-2 pl-4">
        <span className="min-w-0 flex-1 break-words text-sm">{feature.name}</span>
        <span className="text-xs text-onboarding-muted">{TYPE_LABELS[feature.type]}</span>
        {onRemove && <button type="button" onClick={remove} aria-label={`Remove ${feature.name}`} className="onboarding-control flex min-h-11 min-w-11 shrink-0 justify-center text-lg text-onboarding-muted">×</button>}
      </div>
    </li>
  );
}
