"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons/close-icon";
import { MenuIcon } from "@/components/icons/menu-icon";

type MobileNavigationProps = { children: ReactNode };

/**
 * The sidebar on narrow screens. A native modal <dialog> gives focus trapping, Escape to
 * close, a backdrop and an inert page for free. The navigation itself is server-rendered
 * and passed in as children, so only the open/close behaviour runs on the client.
 */
export function MobileNavigation({ children }: MobileNavigationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function closeOnBackdropOrLink(event: MouseEvent<HTMLDialogElement>) {
    // A click on the backdrop targets the dialog itself. A click on a link starts a client-side
    // navigation that keeps this layout mounted, so the dialog has to close explicitly.
    const clickedBackdrop = event.target === event.currentTarget;
    const clickedLink = event.target instanceof Element && event.target.closest("a") !== null;
    if (clickedBackdrop || clickedLink) dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="-ml-1.5 inline-flex size-9 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink lg:hidden"
      >
        <MenuIcon className="size-5" />
        <span className="sr-only">Open navigation</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Navigation"
        onClick={closeOnBackdropOrLink}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r border-line bg-surface text-ink backdrop:bg-ink/40"
      >
        <div className="flex h-full flex-col">
          <div className="flex justify-end px-3 pt-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex size-9 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink"
            >
              <CloseIcon className="size-5" />
              <span className="sr-only">Close navigation</span>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </dialog>
    </>
  );
}
