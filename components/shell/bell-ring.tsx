"use client";

import { useEffect, useState, type ReactNode } from "react";

const RUNG_STORAGE_KEY = "alerts-bell-rung";

type BellRingProps = {
  /** Only when something needs attention: a bell that rings for nothing trains people to ignore it. */
  shouldRing: boolean;
  /** The bell icon, then the count badge (marked `data-bell-badge`). */
  children: ReactNode;
};

/**
 * Rings the bell once per browser session, when the app opens. The layout survives navigation,
 * so moving between pages never rings it again, and `sessionStorage` keeps a reload from doing
 * so. The swing itself is CSS (`[data-bell-ring]` in globals.css); this only decides whether it
 * plays. The attribute is set after mount, so server and client markup match.
 */
export function BellRing({ shouldRing, children }: BellRingProps) {
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (!shouldRing) return;
    try {
      if (sessionStorage.getItem(RUNG_STORAGE_KEY)) return;
      sessionStorage.setItem(RUNG_STORAGE_KEY, "1");
    } catch {
      // Storage can be blocked; then the bell rings on every load, which is still correct.
    }
    setIsRinging(true);
  }, [shouldRing]);

  return (
    <span className="contents" data-bell-ring={isRinging || undefined}>
      {children}
    </span>
  );
}
