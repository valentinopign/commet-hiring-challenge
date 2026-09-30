"use client";

import { useContext, useLayoutEffect, useRef, type ReactNode } from "react";
import { emphasizedEasing, prefersReducedMotion, StepSettledContext } from "@/components/create-plan/motion";

type RevealProps = { className?: string; children: ReactNode };

/**
 * Fields that appear because of a choice (the overage price, yearly billing, a capacity limit…)
 * grow in instead of pushing the page down at once, so the choice reads as their cause. Height
 * and opacity over 200ms, like the sidebar disclosure. Overflow is hidden only while it grows, so
 * focus rings inside are never clipped. Hiding is instant: it answers the person's own click.
 */
export function Reveal({ className, children }: RevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepSettled = useContext(StepSettledContext);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !stepSettled.current) return;
    const reduce = prefersReducedMotion();
    if (!reduce) container.style.overflow = "hidden";
    const animation = container.animate(
      reduce
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ height: "0px", opacity: 0 }, { height: `${container.offsetHeight}px`, opacity: 1 }],
      { duration: reduce ? 150 : 200, easing: emphasizedEasing() },
    );
    const restore = () => {
      container.style.overflow = "";
    };
    animation.onfinish = restore;
    animation.oncancel = restore;
    return () => animation.cancel();
  }, [stepSettled]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
