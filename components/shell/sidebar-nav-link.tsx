"use client";

import Link from "@/components/organizations/catalog-link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { parseOrganizationPath } from "@/lib/organization-routes";

type SidebarNavLinkProps = {
  href: string;
  icon?: ReactNode;
  /** Extra marker after the label, such as a warning icon. */
  trailing?: ReactNode;
  children: ReactNode;
};

/** Client only because the active state depends on the current path. */
export function SidebarNavLink({ href, icon, trailing, children }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const isActive = (parseOrganizationPath(pathname)?.pathname ?? pathname) === href;
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`group/link flex items-center gap-2.5 rounded-control px-2.5 py-1.5 ${
        isActive ? "bg-surface-raised font-medium text-ink" : "text-ink-muted hover:bg-surface-raised/60 hover:text-ink"
      }`}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </Link>
  );
}
