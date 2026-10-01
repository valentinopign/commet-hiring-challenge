"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { emphasizedEasing, prefersReducedMotion } from "@/components/ui/motion";
import { getHandoffTiming } from "@/lib/onboarding/handoff-timing";
import { ditherMasks } from "./dither-masks";

type Handoff = { destination: string; origin: string; scene: HTMLElement | null; background: HTMLElement | null; reduced: boolean };
const SetupHandoffContext = createContext<((destination: string, preview: HTMLElement | null) => void) | null>(null);

function decorativeSnapshot(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((child) => child.removeAttribute("id"));
  // cloneNode does not copy canvas pixels; preserve the existing background texture.
  const canvases = clone.querySelectorAll("canvas");
  element.querySelectorAll("canvas").forEach((canvas, index) => canvases[index]?.getContext("2d")?.drawImage(canvas, 0, 0));
  // Preserve the visible state before snapshot CSS disables entrance and drift animations.
  const copies = clone.querySelectorAll<HTMLElement>(".onboarding-dither-edge, .onboarding-dither-layer");
  element.querySelectorAll<HTMLElement>(".onboarding-dither-edge, .onboarding-dither-layer").forEach((layer, index) => {
    const copy = copies[index];
    if (!copy) return;
    const style = getComputedStyle(layer);
    copy.style.opacity = style.opacity;
    copy.style.transform = style.transform;
  });
  const bounds = element.getBoundingClientRect();
  Object.assign(clone.style, { position: "absolute", left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px` });
  return clone;
}

/** Keep the outgoing scene above routing until its layers finish dissolving. */
export function SetupHandoffProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const busy = useRef(false);
  const backdrop = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLDivElement>(null);

  const begin = useCallback((destination: string, preview: HTMLElement | null) => {
    if (busy.current) return;
    busy.current = true;
    const stage = preview?.closest<HTMLElement>(".onboarding-stage") ?? origin.current?.querySelector<HTMLElement>(".onboarding-stage");
    const scene = stage ? decorativeSnapshot(stage) : null;
    const background = scene?.querySelector<HTMLElement>(".onboarding-dither") ?? null;
    if (background && scene) {
      // Keep the texture outside the scene's final mask so it can withdraw independently.
      background.remove();
      background.style.zIndex = "0";
      scene.style.zIndex = "1";
      scene.style.background = "transparent";
    }
    setHandoff({ destination, origin: pathname, scene, background, reduced: prefersReducedMotion() });
  }, [pathname]);

  useLayoutEffect(() => {
    if (!handoff) return;
    const container = origin.current;
    if (handoff.background) backdrop.current?.append(handoff.background);
    if (handoff.scene) backdrop.current?.append(handoff.scene);
    const wasInert = container?.inert ?? false;
    if (container) container.inert = true;
    if (document.activeElement instanceof HTMLElement && container?.contains(document.activeElement)) document.activeElement.blur();
    router.push(handoff.destination);
    return () => {
      handoff.scene?.remove();
      handoff.background?.remove();
      if (container) container.inert = wasInert;
    };
  }, [handoff, router]);

  useLayoutEffect(() => {
    if (!handoff || pathname === handoff.origin) return;
    if (pathname !== handoff.destination) {
      busy.current = false;
      setHandoff(null);
      return;
    }
    const animations: Animation[] = [];
    let cancelled = false;
    let started = false;
    const reveal = () => {
      const dashboard = document.querySelector<HTMLElement>("[data-organization-dashboard] #main");
      const shell = dashboard?.closest<HTMLElement>("[data-organization-dashboard]");
      if (!dashboard || !shell || started) return;
      started = true;
      const timing = getHandoffTiming(handoff.reduced);
      const easing = emphasizedEasing();
      if (handoff.background && !handoff.reduced) {
        const edges = handoff.background.querySelectorAll<HTMLElement>(".onboarding-dither-edge");
        for (const edge of edges) {
          const right = edge.classList.contains("onboarding-dither-right");
          animations.push(edge.animate([
            { opacity: edge.style.opacity, transform: edge.style.transform },
            { opacity: 0, transform: right ? "translateX(100%)" : "translateX(-100%)" },
          ], { duration: timing.background, delay: right ? timing.backgroundStagger : 0, easing, fill: "both" }));
        }
      }
      if (handoff.scene && !handoff.reduced) {
        const layers = [...handoff.scene.querySelectorAll<HTMLElement>("[data-setup-exit]"), handoff.scene];
        for (const layer of layers) {
          const order = layer === handoff.scene ? 5 : Number(layer.dataset.setupExit ?? 0);
          animations.push(layer.animate([
            { opacity: 1, maskImage: "none", offset: 0 },
            { opacity: 1, maskImage: "none", offset: 0.15 },
            { opacity: 1, maskImage: ditherMasks[0], offset: 0.16 },
            { opacity: 1, maskImage: ditherMasks[1], offset: 0.36 },
            { opacity: 1, maskImage: ditherMasks[2], offset: 0.56 },
            { opacity: 0.8, maskImage: ditherMasks[3], offset: 0.76 },
            { opacity: 0, maskImage: ditherMasks[3], offset: 1 },
          ], { duration: timing.layer, delay: order * timing.stagger, easing: "linear", fill: "both" }));
        }
      }
      // The destination stays hidden until every outgoing layer has completed.
      animations.push(shell.animate([
        { opacity: 0, transform: handoff.reduced ? "none" : "translateY(12px)" },
        { opacity: 1, transform: "none" },
      ], { duration: timing.reveal, delay: timing.exit, easing, fill: "both" }));
      if (backdrop.current) animations.push(backdrop.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: timing.reveal, delay: timing.exit, easing, fill: "both" }));
      Promise.all(animations.map((animation) => animation.finished)).then(() => {
        if (cancelled) return;
        busy.current = false;
        setHandoff(null);
        if (origin.current) origin.current.inert = false;
        dashboard.setAttribute("tabindex", "-1");
        dashboard.focus({ preventScroll: true });
      }).catch(() => { /* Navigation or unmount cancels the decorative sequence. */ });
    };
    reveal();
    // Wait for the company's real content, rather than dissolving into a loading screen.
    const observer = new MutationObserver(reveal);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelled = true; observer.disconnect(); animations.forEach((animation) => animation.cancel()); };
  }, [handoff, pathname]);

  return <SetupHandoffContext value={begin}>
    <div ref={origin}>{children}</div>
    {handoff && createPortal(<div className="setup-handoff" aria-hidden="true" inert>
      <div ref={backdrop} className="setup-handoff-backdrop" />
    </div>, document.body)}
  </SetupHandoffContext>;
}

export function useSetupHandoff() {
  const begin = useContext(SetupHandoffContext);
  if (!begin) throw new Error("SetupHandoffProvider is required.");
  return begin;
}
