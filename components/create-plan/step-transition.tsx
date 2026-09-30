"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { emphasizedEasing, prefersReducedMotion, StepSettledContext } from "@/components/create-plan/motion";

export type StepDirection = "forward" | "back";

type StepTransitionProps = {
  /** `null` on the first render: the page itself just loaded, so nothing needs a direction. */
  direction: StepDirection | null;
  children: ReactNode;
};

/**
 * Keyed by step, so every step mounts fresh. The new step slides 8px in from the side it comes
 * from (forward: from the right) while it fades in; the old one leaves at once, because waiting
 * for an exit would only delay the step the person asked for. Only transform and opacity change,
 * so focus moving to the step's title and the scroll that follows are unaffected.
 */
export function StepTransition({ direction, children }: StepTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settled = useRef(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !direction) return;
    const reduce = prefersReducedMotion();
    const offset = direction === "forward" ? 8 : -8;
    const animation = container.animate(
      reduce
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: `translateX(${offset}px)` }, { opacity: 1, transform: "none" }],
      { duration: reduce ? 150 : 200, easing: emphasizedEasing() },
    );
    return () => animation.cancel();
    // The direction only changes together with the step, which remounts this component (it is keyed).
  }, [direction]);

  // Runs after every child's layout effect, so content present at mount never animates on its own.
  useEffect(() => {
    settled.current = true;
  }, []);

  return (
    <StepSettledContext value={settled}>
      <div ref={containerRef}>{children}</div>
    </StepSettledContext>
  );
}
