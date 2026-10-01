"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type RouteShellProps = { dashboard: ReactNode; children: ReactNode };

/** The onboarding has its own canvas; dashboard content still renders on the server. */
export function RouteShell({ dashboard, children }: RouteShellProps) {
  const pathname = usePathname();
  if (pathname.startsWith("/organizations/")) return children;
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    return <main id="main">{children}</main>;
  }
  return dashboard;
}
