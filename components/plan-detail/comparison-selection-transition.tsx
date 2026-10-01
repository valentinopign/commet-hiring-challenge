"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/components/ui/motion";

/** Finish closing before routing can replace the popover's DOM. Selection stays in the URL. */
export function ComparisonSelectionTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const navigation = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (navigation.current !== null) clearTimeout(navigation.current); }, []);

  function select(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[href]");
    const popover = event.currentTarget.closest<HTMLElement>("[popover]");
    if (!link || !popover || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const target = new URL(link.href);
    if (target.origin !== window.location.origin) return;
    // Capture precedes Next Link's own click handler, preserving modified/native navigation.
    event.preventDefault();
    event.stopPropagation();
    if (navigation.current !== null) clearTimeout(navigation.current);
    popover.hidePopover();
    navigation.current = setTimeout(() => {
      navigation.current = null;
      router.push(`${target.pathname}${target.search}${target.hash}`, { scroll: false });
    }, prefersReducedMotion() ? 150 : 180);
  }

  return <div onClickCapture={select}>{children}</div>;
}
