"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { emphasizedEasing, prefersReducedMotion } from "@/components/ui/motion";

type Props = { comparisonKey: string; children: ReactNode };

/** The server owns all values. This boundary only animates the new right-hand configuration. */
export function ComparisonMotion({ comparisonKey, children }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const previous = useRef<string | null>(null);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const entering = previous.current === null;
    previous.current = comparisonKey;
    const reduced = prefersReducedMotion();
    const animations: Animation[] = [];
    element.querySelectorAll<HTMLElement>("[data-comparison-value]").forEach((value) => {
      animations.push(value.animate(
        reduced ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: "translateX(6px)" }, { opacity: 1, transform: "translateX(0)" }],
        { duration: reduced ? 150 : 220, easing: emphasizedEasing() },
      ));
    });
    if (entering) {
      element.querySelectorAll<HTMLElement>("[data-comparison-card], [data-comparison-bar]").forEach((surface) => {
        animations.push(surface.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: emphasizedEasing() }));
      });
    }
    return () => { animations.forEach((animation) => animation.cancel()); };
  }, [comparisonKey]);

  return <div ref={container} data-plan-comparison className="pr-11">{children}</div>;
}
