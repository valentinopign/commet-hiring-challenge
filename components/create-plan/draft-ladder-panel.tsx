"use client";

import { LadderList } from "@/components/create-plan/ladder-list";
import type { DraftLadderView } from "@/components/create-plan/use-draft-ladder";
import { ChevronRightIcon } from "@/components/icons/chevron-right-icon";
import { LayersIcon } from "@/components/icons/layers-icon";
import { WidgetHeader } from "@/components/ui/widget-header";

type DraftLadderPanelProps = {
  view: DraftLadderView;
  draftPricePending: boolean;
  currency: string;
  /** `sidebar` beside the form on wide screens; `collapsible` above it on narrow ones. */
  variant: "sidebar" | "collapsible";
};

/**
 * The plan ladder with the draft in it, visible through the whole flow. Rendered once per layout;
 * CSS shows the one that fits, and the position is announced once by the flow, not here.
 */
export function DraftLadderPanel({ view, draftPricePending, currency, variant }: DraftLadderPanelProps) {
  const list = (
    <LadderList
      entries={view.entries}
      isPlaced={view.isPlaced}
      draftLabel="Draft"
      draftPricePending={draftPricePending}
      currency={currency}
      label="Plans by monthly price, with this plan"
    />
  );

  if (variant === "collapsible") {
    return (
      <details className="group/ladder disclosure-animated overflow-hidden rounded-card border border-line lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 bg-surface-raised px-3.5 py-2.5 select-none [&::-webkit-details-marker]:hidden">
          <LayersIcon className="size-4 shrink-0 text-ink-muted" />
          <span className="min-w-0 flex-1">
            <span className="font-medium">Plan ladder</span>
            <span className="block truncate text-caption text-ink-muted">{view.positionText}</span>
          </span>
          <ChevronRightIcon className="size-3.5 shrink-0 text-ink-muted transition-transform duration-150 ease-emphasized group-open/ladder:rotate-90 group-open/ladder:duration-200 motion-reduce:transition-none" />
        </summary>
        <div className="border-t border-line bg-surface-card p-2">{list}</div>
      </details>
    );
  }

  return (
    <aside aria-labelledby="ladder-heading" className="sticky top-[calc(var(--spacing-topbar)+1rem)] hidden lg:block">
      <section className="overflow-hidden rounded-card border border-line">
        <WidgetHeader
          icon={<LayersIcon className="size-4 shrink-0 text-ink-muted" />}
          title={<h2 id="ladder-heading" className="font-medium">Plan ladder</h2>}
        />
        <div className="bg-surface-card p-2">
          <p className="px-3 pt-1 pb-2 text-caption text-ink-muted">{view.positionText}</p>
          {list}
        </div>
      </section>
    </aside>
  );
}
