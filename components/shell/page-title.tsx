"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getPageTitle } from "@/lib/page-titles";

const MILLISECONDS_PER_CHARACTER = 35;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type TypewriterTextProps = { text: string; animate: boolean };

/** Remounted per title (see the key below), so every navigation starts typing from zero. */
function TypewriterText({ text, animate }: TypewriterTextProps) {
  // The initializer only touches `window` when animating, which never happens on the server.
  const [typedLength, setTypedLength] = useState(() =>
    animate && !prefersReducedMotion() ? 0 : text.length,
  );
  const isTyping = typedLength < text.length;

  useEffect(() => {
    if (!isTyping) return;
    const timer = window.setInterval(() => {
      setTypedLength((length) => Math.min(length + 1, text.length));
    }, MILLISECONDS_PER_CHARACTER);
    return () => window.clearInterval(timer);
  }, [isTyping, text.length]);

  return (
    <>
      {text.slice(0, typedLength)}
      {isTyping && <span className="ml-px inline-block h-[1.1em] w-0.5 translate-y-[0.15em] bg-live" />}
    </>
  );
}

type PageTitleProps = { planNames: Record<string, string> };

/**
 * The title of the current page, in the top bar. Visual only: each page keeps its own <h1>
 * (visually hidden) so heading navigation and the skip link still land on it, and a screen
 * reader never hears the title half typed. The first render shows it whole, which keeps server
 * and client markup identical; only a navigation types it out.
 */
export function PageTitle({ planNames }: PageTitleProps) {
  const title = getPageTitle(usePathname(), planNames);
  const [previousTitle, setPreviousTitle] = useState(title);
  const [hasNavigated, setHasNavigated] = useState(false);
  // Adjusting state while rendering, React's pattern for reacting to a changed value without an effect.
  if (title !== previousTitle) {
    setPreviousTitle(title);
    setHasNavigated(true);
  }

  if (!title) return null;
  return (
    <p aria-hidden="true" className="flex min-w-0 items-center gap-2 font-medium">
      <span className="text-ink-muted">/</span>
      <span className="truncate">
        <TypewriterText key={title} text={title} animate={hasNavigated} />
      </span>
    </p>
  );
}
