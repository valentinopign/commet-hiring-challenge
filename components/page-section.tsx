import type { ReactNode } from "react";

type PageSectionProps = {
  id: string;
  title: string;
  description?: string;
  /** Controls on the right of the title, such as "Create plan". */
  actions?: ReactNode;
  children: ReactNode;
};

export function PageSection({ id, title, description, actions, children }: PageSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 id={headingId} className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-caption text-ink-muted">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
