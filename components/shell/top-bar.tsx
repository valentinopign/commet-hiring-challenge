import type { ReactNode } from "react";

type TopBarProps = {
  organizationName: string;
  /** The mobile navigation trigger; hidden on wide screens where the sidebar is always visible. */
  menu: ReactNode;
  alerts: ReactNode;
};

export function TopBar({ organizationName, menu, alerts }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface">
      {/* Same width and padding as <main>, so "Pricing" starts on the content's left edge. */}
      <div className="mx-auto flex h-12 max-w-page items-center gap-2 px-4 sm:px-6 lg:px-8">
        {menu}
        {/* On mobile the sidebar is hidden, so the organisation name moves up here. */}
        <span className="font-semibold lg:hidden">{organizationName}</span>
        <span className="hidden text-ink-muted lg:inline">Pricing</span>
        <div className="ml-auto">{alerts}</div>
      </div>
    </header>
  );
}
