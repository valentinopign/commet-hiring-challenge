"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type RouteShellProps = { children: ReactNode };

/** Each catalog route owns its stored dashboard; only onboarding needs a separate main. */
export function RouteShell({ children }: RouteShellProps) {
  const pathname = usePathname();
  if (pathname.startsWith("/organizations/")) return children;
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    return <main id="main">{children}</main>;
  }
  return children;
}
