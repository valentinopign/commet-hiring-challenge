"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SidebarNavLinkProps = {
  href: string;
  icon?: ReactNode;
  /** Extra marker after the label, such as a warning icon. */
  trailing?: ReactNode;
  children: ReactNode;
};

/** Client only because the active state depends on the current path. */
export function SidebarNavLink({ href, icon, trailing, children }: SidebarNavLinkProps) {
  const isActive = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-2 rounded-sm px-2 py-1.5 ${
        isActive ? "bg-line/70 font-medium text-ink" : "text-ink-muted hover:bg-canvas hover:text-ink"
      }`}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </Link>
  );
}
