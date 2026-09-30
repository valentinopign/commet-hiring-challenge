import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
};

/**
 * Top bar across the full width, then the sidebar and the sheet. Top bar and sidebar share the
 * page background; only the sheet is raised, so the content is the one thing that stands out.
 * Below `lg` the sidebar lives in the top bar's menu.
 */
export function AppShell({ sidebar, topBar, children }: AppShellProps) {
  return (
    <div className="min-h-dvh">
      {topBar}
      <div className="lg:grid lg:grid-cols-[var(--spacing-sidebar)_minmax(0,1fr)]">
        {/* A plain container: the <nav> inside is the landmark, an <aside> around it would add a redundant "complementary" one. */}
        <div
          className="sticky top-topbar hidden h-[calc(100dvh-var(--spacing-topbar))] overflow-y-auto lg:block"
        >
          {sidebar}
        </div>
        <main
          id="main"
          className="mx-2 mb-2 min-h-[calc(100dvh-var(--spacing-topbar)-0.5rem)] min-w-0 rounded-sheet border border-line bg-surface lg:ml-0"
        >
          <div className="mx-auto max-w-page px-4 pt-7 pb-8 sm:px-6 lg:px-8 lg:pt-9">{children}</div>
        </main>
      </div>
    </div>
  );
}
