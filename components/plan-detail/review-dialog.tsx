"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { outlineControlClass } from "@/components/ui/control-styles";
import { prefersReducedMotion } from "@/components/ui/motion";

/** Native modal focus/inert handling, a side panel on desktop and full-width on phones. */
export function ReviewDialog({ open, title, onClose, children, animate = true }: { open: boolean; title: string; onClose: () => void; children: ReactNode; animate?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const close = useRef(onClose);
  const closing = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  close.current = onClose;
  function finishClose() {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    closing.current = false;
    close.current();
  }
  function requestClose(pointer: boolean) {
    if (!pointer || !animate) { finishClose(); return; }
    if (closing.current) return;
    closing.current = true;
    dialog.current?.setAttribute("data-closing", "true");
    // Keep the native modal/inert background until its exit completes, with a fallback for interrupted transitions.
    closeTimer.current = setTimeout(finishClose, prefersReducedMotion() ? 170 : 220);
  }
  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    heading.current?.focus({ preventScroll: true });
    return () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
      closeTimer.current = null;
      closing.current = false;
      element.removeAttribute("data-closing");
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);
  return <dialog ref={dialog} data-animate={animate} aria-labelledby="plan-dialog-title" onCancel={(event) => { event.preventDefault(); requestClose(false); }}
    onTransitionEnd={(event) => { if (closing.current && event.target === dialog.current && event.propertyName === "opacity") finishClose(); }}
    onClickCapture={(event) => {
      if (event.target instanceof Element && event.target.closest("[data-dialog-close]")) {
        event.preventDefault();
        event.stopPropagation();
        requestClose(event.detail > 0);
      }
    }}
    className="plan-review-dialog fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-y-auto border-0 bg-surface-card p-0 text-ink backdrop:bg-black/50 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(44rem,100vw)] sm:border-l sm:border-line">
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface-card px-5 py-4">
      <h2 ref={heading} tabIndex={-1} id="plan-dialog-title" className="text-lg font-semibold outline-none">{title}</h2>
      <button type="button" className={`${outlineControlClass} min-h-11`} onClick={(event) => requestClose(event.detail > 0)}>Close</button>
    </div>
    <div className="space-y-6 px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
  </dialog>;
}
