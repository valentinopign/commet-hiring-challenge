import type { ReactNode } from "react";

type PageSectionProps = {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function PageSection({ id, title, description, children }: PageSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className="mt-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h2 id={headingId} className="font-semibold">{title}</h2>
        {description && <p className="text-caption text-ink-muted">{description}</p>}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}
