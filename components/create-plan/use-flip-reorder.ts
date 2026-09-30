"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

const MOVE_DURATION = 320;
const FADE_DURATION = 180;

function currentTranslateY(element: HTMLElement): number {
  const { transform } = getComputedStyle(element);
  return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
}

/**
 * FLIP for a reordered list, with no library: after React moves the items, each one that changed
 * place is drawn back where it was (a translate) and animated to its new place.
 *
 * Positions are read with `offsetTop`, which ignores transforms, so a move that starts while
 * another is running begins from where the item is on screen rather than jumping.
 * With reduced motion nothing slides; the item named by `fadeKey` fades in at its new place.
 *
 * Items carry `data-flip-key`; `orderSignature` changes whenever the order does.
 */
export function useFlipReorder(
  containerRef: RefObject<HTMLElement | null>,
  orderSignature: string,
  fadeKey: string,
) {
  const layoutTops = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // A collapsed panel lays nothing out: forget the positions so opening it never animates from 0.
    if (container.getClientRects().length === 0) {
      layoutTops.current = new Map();
      return;
    }
    const items = [...container.querySelectorAll<HTMLElement>("[data-flip-key]")];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const easing = getComputedStyle(document.documentElement).getPropertyValue("--ease-emphasized").trim() || "ease-out";
    const nextTops = new Map<string, number>();

    for (const item of items) {
      const key = item.dataset.flipKey;
      if (!key) continue;
      const previousTop = layoutTops.current.get(key);
      // Read before cancelling: where a running move has the item right now.
      const inFlight = currentTranslateY(item);
      const top = item.offsetTop;
      nextTops.set(key, top);
      if (previousTop === undefined) continue;

      const delta = previousTop + inFlight - top;
      if (Math.abs(delta) < 0.5) continue;
      for (const animation of item.getAnimations()) animation.cancel();

      if (reduceMotion) {
        if (key === fadeKey) item.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_DURATION, easing: "ease-out" });
        continue;
      }
      item.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
        { duration: MOVE_DURATION, easing },
      );
    }
    layoutTops.current = nextTops;
  }, [containerRef, orderSignature, fadeKey]);
}
