"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LadderList } from "@/components/create-plan/ladder-list";
import { CheckIcon } from "@/components/icons/check-icon";
import { outlineControlClass, primaryControlClass } from "@/components/ui/control-styles";
import type { LadderEntry } from "@/lib/derive/types";

type PublishConfirmationProps = {
  planName: string;
  entries: LadderEntry[];
  positionText: string;
  currency: string;
  onCreateAnother: () => void;
};

/** The end of the flow. It says plainly that nothing was saved: the publish is simulated. */
export function PublishConfirmation({ planName, entries, positionText, currency, onCreateAnother }: PublishConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <section aria-labelledby="published-heading" className="max-w-2xl space-y-6">
      <div>
        <p className="flex items-center gap-2 text-caption font-medium text-live">
          <CheckIcon className="size-4 shrink-0" />
          Published (simulated)
        </p>
        <h2 id="published-heading" ref={headingRef} tabIndex={-1} className="mt-1 text-xl font-semibold tracking-tight focus:outline-none">
          {planName} is ready
        </h2>
        <p className="mt-2 max-w-prose text-ink-muted">
          Nothing was saved. This dashboard is a prototype: in Commet, publishing would create the plan and its first
          version, v1, and the Overview would list it.
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface-card p-2">
        <p className="px-3 pt-1 pb-2 text-caption text-ink-muted">{positionText}</p>
        <LadderList
          entries={entries}
          isPlaced
          draftLabel="New"
          draftPricePending={false}
          currency={currency}
          label="Plans by monthly price, with the new plan"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onCreateAnother} className={primaryControlClass}>
          Create another plan
        </button>
        <Link href="/" className={outlineControlClass}>
          Back to overview
        </Link>
      </div>
    </section>
  );
}
