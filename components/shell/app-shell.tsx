import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
};

/** Sidebar on the left from `lg` up; below that the sidebar lives in the top bar's menu. */
export function AppShell({ sidebar, topBar, children }: AppShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[var(--spacing-sidebar)_minmax(0,1fr)]">
      <aside
        aria-label="Sidebar"
        className="sticky top-0 hidden h-screen overflow-y-auto border-r border-line bg-surface lg:block"
      >
        {sidebar}
      </aside>
      <div className="min-w-0">
        {topBar}
        <main id="main" className="mx-auto max-w-page px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
