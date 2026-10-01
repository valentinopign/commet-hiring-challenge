"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { emphasizedEasing, prefersReducedMotion } from "@/components/ui/motion";
import { handoffTransform } from "@/lib/onboarding/handoff-geometry";
import { getHandoffTiming } from "@/lib/onboarding/handoff-timing";

type Handoff = { destination: string; origin: string; source: DOMRect; width: number; height: number; clone: HTMLElement | null; reduced: boolean };
const SetupHandoffContext = createContext<((destination: string, preview: HTMLElement | null) => void) | null>(null);

/** The overlay lives above routing, so measured viewport bounds survive the page change. */
export function SetupHandoffProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const busy = useRef(false);
  const backdrop = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const previewLayer = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLDivElement>(null);

  const begin = useCallback((destination: string, preview: HTMLElement | null) => {
    if (busy.current) return;
    busy.current = true;
    const source = preview?.getBoundingClientRect() ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    const clone = preview?.cloneNode(true) as HTMLElement | undefined;
    // A decorative snapshot must not duplicate accessible IDs or receive focus.
    clone?.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    clone?.removeAttribute("id");
    const style = preview ? getComputedStyle(preview) : null;
    setHandoff({ destination, origin: pathname, source, width: style ? parseFloat(style.width) : source.width, height: style ? parseFloat(style.height) : source.height, clone: clone ?? null, reduced: prefersReducedMotion() });
  }, [pathname]);

  useLayoutEffect(() => {
    if (!handoff) return;
    const container = origin.current;
    const snapshot = previewLayer.current;
    if (handoff.clone && snapshot) snapshot.append(handoff.clone);
    const wasInert = container?.inert ?? false;
    if (container) container.inert = true;
    // Remove focus from Finish setup before its route disappears.
    if (document.activeElement instanceof HTMLElement && container?.contains(document.activeElement)) document.activeElement.blur();
    const timing = getHandoffTiming(handoff.reduced);
    const cover = backdrop.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: timing.cover, easing: emphasizedEasing(), fill: "both" });
    const navigation = window.setTimeout(() => router.push(handoff.destination), timing.cover);
    return () => {
      window.clearTimeout(navigation);
      cover?.cancel();
      handoff.clone?.remove();
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
      if (!dashboard || started) return;
      started = true;
      const target = dashboard.getBoundingClientRect();
      const timing = getHandoffTiming(handoff.reduced);
      const easing = emphasizedEasing();
      if (frame.current && !handoff.reduced) {
        const initial = handoffTransform(handoff.source, handoff.width, handoff.height);
        const final = handoffTransform(target, handoff.width, handoff.height, window.innerHeight);
        animations.push(frame.current.animate([{ transform: initial }, { transform: final }], { duration: timing.expansion, easing: getComputedStyle(document.documentElement).getPropertyValue("--ease-handoff").trim(), fill: "both" }));
      }
      if (previewLayer.current) animations.push(previewLayer.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: timing.previewFade, delay: timing.previewDelay, easing, fill: "both" }));
      // Backwards fill keeps the cover fully opaque throughout expansion.
      if (backdrop.current) animations.push(backdrop.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: timing.reveal, delay: timing.revealDelay, easing, fill: "both" }));
      if (frame.current && !handoff.reduced) animations.push(frame.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: timing.reveal, delay: timing.revealDelay, easing, fill: "both" }));
      Promise.all(animations.map((animation) => animation.finished)).then(() => {
        if (cancelled) return;
        busy.current = false;
        setHandoff(null);
        if (origin.current) origin.current.inert = false;
        dashboard.setAttribute("tabindex", "-1");
        dashboard.focus({ preventScroll: true });
      }).catch(() => { /* Navigation or unmount can cancel the decorative animation. */ });
    };
    reveal();
    // Do not reveal an empty destination if route loading/hydration takes longer.
    const observer = new MutationObserver(reveal);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelled = true; observer.disconnect(); animations.forEach((animation) => animation.cancel()); };
  }, [handoff, pathname]);

  return <SetupHandoffContext value={begin}>
    <div ref={origin}>{children}</div>
    {handoff && createPortal(<div className="setup-handoff" aria-hidden="true" inert>
      <div ref={backdrop} className="setup-handoff-backdrop" />
      <div ref={frame} className="setup-handoff-frame" style={{ width: handoff.width, height: handoff.height, opacity: handoff.reduced ? 0 : 1, transform: handoffTransform(handoff.source, handoff.width, handoff.height) }}>
        <div ref={previewLayer} className="setup-handoff-preview onboarding-builder" />
      </div>
    </div>, document.body)}
  </SetupHandoffContext>;
}

export function useSetupHandoff() {
  const begin = useContext(SetupHandoffContext);
  if (!begin) throw new Error("SetupHandoffProvider is required.");
  return begin;
}
