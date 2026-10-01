"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "@/components/organizations/catalog-link";
import { outlineControlClass } from "@/components/ui/control-styles";

type Props = { leftLabel: string; rightLabel: string; differences: number; total: number; exitHref: string };

/** Measure only the fixed chrome; selection and comparison content remain URL-owned. */
export function ComparisonBar({ leftLabel, rightLabel, differences, total, exitHref }: Props) {
  const bar = useRef<HTMLDivElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = bar.current;
    const space = spacer.current;
    if (!element || !space) return;
    const root = document.documentElement;
    const comparison = element.closest<HTMLElement>("[data-plan-comparison]");
    const previous = root.style.scrollPaddingBottom;
    const measure = () => {
      const height = element.getBoundingClientRect().height;
      space.style.height = `${height + 24}px`;
      comparison?.style.setProperty("--comparison-bar-height", `${height}px`);
      root.style.scrollPaddingBottom = `${height + 16}px`;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      comparison?.style.removeProperty("--comparison-bar-height");
      root.style.scrollPaddingBottom = previous;
    };
  }, []);

  return <>
    <div ref={spacer} aria-hidden="true" className="h-36" />
    <div ref={bar} data-comparison-bar role="region" aria-label="Plan comparison actions" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-surface-raised px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm sm:px-6 lg:left-sidebar">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 space-y-1">
          <p className="font-medium">Comparing {leftLabel} with {rightLabel}</p>
          <p className="text-caption text-ink-muted">{differences} of {total} features differ</p>
        </div>
        <Link href={exitHref} scroll={false} className={`${outlineControlClass} min-h-11 shrink-0`}>Exit compare</Link>
      </div>
    </div>
  </>;
}
