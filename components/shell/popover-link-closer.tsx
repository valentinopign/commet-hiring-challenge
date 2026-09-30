"use client";

import type { MouseEvent, ReactNode } from "react";

type PopoverLinkCloserProps = { children: ReactNode };

/**
 * Next.js links navigate without reloading the page, so a native popover would stay open
 * on top of the new page. This closes the enclosing popover when a link inside it is used.
 */
export function PopoverLinkCloser({ children }: PopoverLinkCloserProps) {
  function closeOnLinkClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element) || !event.target.closest("a")) return;
    event.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover();
  }

  // Delegated listener: the links inside remain the interactive, focusable elements.
  return <div onClick={closeOnLinkClick}>{children}</div>;
}
