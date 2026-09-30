import type { ReactNode } from "react";

type PageHeadingProps = {
  title: string;
  description: string;
  /** The page's primary action, centred on the title line. */
  action?: ReactNode;
};

export function PageHeading({ title, description, action }: PageHeadingProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {action}
      </div>
      <p className="mt-0.5 max-w-prose text-ink-muted">{description}</p>
    </div>
  );
}
