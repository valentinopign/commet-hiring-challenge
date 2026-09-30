import type { ReactNode } from "react";
import { WidgetHeader } from "@/components/ui/widget-header";

type ReviewSectionProps = {
  id: string;
  title: string;
  /** Opens the step where these values are set. */
  onEdit: () => void;
  children: ReactNode;
};

export function ReviewSection({ id, title, onEdit, children }: ReviewSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-card border border-line">
      <WidgetHeader
        title={<h3 id={headingId} className="font-medium">{title}</h3>}
        trailing={
          <button
            type="button"
            onClick={onEdit}
            className="rounded-control px-1.5 py-0.5 text-caption font-medium text-ink-muted transition-colors hover:bg-surface-card hover:text-ink"
          >
            Edit<span className="sr-only"> {title.toLowerCase()}</span>
          </button>
        }
      />
      <div className="bg-surface-card px-4 py-3">{children}</div>
    </section>
  );
}
