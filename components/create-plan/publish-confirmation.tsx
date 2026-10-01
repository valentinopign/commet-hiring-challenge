"use client";

import Link from "@/components/organizations/catalog-link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { LadderList } from "@/components/create-plan/ladder-list";
import { emphasizedEasing, prefersReducedMotion } from "@/components/ui/motion";
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
  const badgeRef = useRef<HTMLParagraphElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const ladderRef = useRef<HTMLDivElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  /*
   * The close of the flow, told in three beats: the "published" mark, then the words, then the
   * plan taking its place on the ladder and its dashed draft border turning solid. The other
   * plans do not move: the new one is the news. With reduced motion every beat is a fade.
   */
  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    const easing = emphasizedEasing();
    const fade = (from: Keyframe) => (reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, ...from }, { opacity: 1, transform: "none" }]);
    const newRow = ladderRef.current?.querySelector<HTMLElement>("[data-new-plan]");
    const ring = newRow?.querySelector<HTMLElement>("[data-published-ring]");
    const beats: [HTMLElement | null | undefined, Keyframe[], number, number][] = [
      [badgeRef.current, fade({ transform: "scale(0.9)" }), 200, 0],
      [introRef.current, fade({ transform: "translateY(6px)" }), 200, 40],
      [newRow, fade({ transform: "translateY(-6px)" }), 250, 150],
      [ring, [{ opacity: 0 }, { opacity: 1 }], 200, 400],
    ];
    // `fill: backwards` holds each element at its first frame until its beat starts.
    const animations = beats.flatMap(([element, keyframes, duration, delay]) =>
      element ? [element.animate(keyframes, { duration, delay, easing, fill: "backwards" })] : [],
    );
    return () => animations.forEach((animation) => animation.cancel());
  }, []);

  return (
    <section aria-labelledby="published-heading" className="max-w-2xl space-y-6">
      <div>
        <p ref={badgeRef} className="flex w-fit items-center gap-2 text-caption font-medium text-live-ink">
          <CheckIcon className="size-4 shrink-0" />
          Published (simulated)
        </p>
        <div ref={introRef}>
          <h2 id="published-heading" ref={headingRef} tabIndex={-1} className="mt-1 text-xl font-semibold tracking-tight focus:outline-none">
            {planName} is ready
          </h2>
          <p className="mt-2 max-w-prose text-ink-muted">
            Nothing was saved. This dashboard is a prototype: in Commet, publishing would create the plan and its first
            version, v1, and the Overview would list it.
          </p>
        </div>
      </div>

      <div ref={ladderRef} className="rounded-card border border-line bg-surface-card p-2">
        <p className="px-3 pt-1 pb-2 text-caption text-ink-muted">{positionText}</p>
        <LadderList
          entries={entries}
          isPlaced
          draftLabel="New"
          isPublished
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
