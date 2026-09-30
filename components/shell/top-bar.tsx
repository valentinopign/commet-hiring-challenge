import type { ReactNode } from "react";
import { CommetLogo } from "@/components/shell/commet-logo";
import { OrganizationMark } from "@/components/shell/organization-mark";

type TopBarProps = {
  organizationName: string;
  /** The mobile navigation trigger; hidden on wide screens where the sidebar is always visible. */
  menu: ReactNode;
  alerts: ReactNode;
  themeToggle: ReactNode;
  user: ReactNode;
  /** The current page, after the organisation, like a breadcrumb. */
  pageTitle: ReactNode;
};

/** Full width, on the page background and without a border: the sheet below is what stands out. */
export function TopBar({ organizationName, menu, alerts, themeToggle, user, pageTitle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-topbar items-center gap-3 bg-canvas px-3 sm:px-4">
      {menu}
      {/* On a phone the organisation is the context that matters; the product logo gives way. */}
      <div className="hidden items-center gap-3 sm:flex">
        <CommetLogo />
        <span aria-hidden="true" className="h-5 w-px bg-line-strong" />
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <OrganizationMark organizationName={organizationName} />
        {pageTitle}
      </div>
      {/* Wider gap on touch so the 44px hit areas of neighbouring controls do not overlap. */}
      <div className="ml-auto flex items-center gap-2 pointer-coarse:gap-3">
        {alerts}
        {themeToggle}
        {user}
      </div>
    </header>
  );
}
