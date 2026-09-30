"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronRightIcon } from "@/components/icons/chevron-right-icon";
import { PlusIcon } from "@/components/icons/plus-icon";
import { OrganizationMark } from "@/components/shell/organization-mark";
import { touchTargetClass } from "@/components/ui/control-styles";
import { prefersReducedMotion } from "@/components/ui/motion";
import type { OrganizationOption } from "@/lib/derive/navigation";

const POPOVER_ID = "organization-switcher";
/** Space between the glass edge and the name it wraps. */
const BOX_PADDING = 6;
/** The glass edge is a 1px border outside the padding. */
const BOX_BORDER = 1;
/** On a phone the name is hidden and only the mark shows, so the rows need room of their own. */
const NARROW_TRIGGER = 100;
const NARROW_BOX_WIDTH = 176;
/** How much the name grows while the box is open (`scale-105` below). */
const NAME_GROWTH = 1.05;

type OrganizationSwitcherProps = {
  organizations: OrganizationOption[];
  currentId: string;
};

/** Position of a row in the drop-out cascade (see `drop-item` in globals.css). */
function dropIndex(index: number): CSSProperties {
  return { "--drop-index": index } as CSSProperties;
}

const nameRowClass = "flex min-w-0 origin-left items-center gap-1.5 rounded-control px-1.5 py-1";

/**
 * The organisation name is the current option. Pressing it grows the name a little and unfolds a
 * glass box around it, as wide as the name, with the other organisations and "Add organization"
 * listed under it. The box lies exactly over the name and repeats it in the same place (that copy
 * closes the box), so the name reads as the top of the box rather than appearing twice. A native
 * popover, like the alerts bell: light dismiss, Escape and the top layer come from the browser.
 * Client-side for placing the box on the name, which moves with the logo and the screen width.
 */
export function OrganizationSwitcher({ organizations, currentId }: OrganizationSwitcherProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [addRequested, setAddRequested] = useState(false);
  // Choosing another organisation only changes the name shown: there is no other catalog to load.
  const [selectedId, setSelectedId] = useState(currentId);
  const selected = organizations.find((organization) => organization.id === selectedId);
  const others = organizations.filter((organization) => organization.id !== selectedId);
  const rowCount = others.length + 1;

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    function handleToggle(event: Event) {
      const opening = (event as ToggleEvent).newState === "open";
      if (opening && popover && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const inset = BOX_PADDING + BOX_BORDER;
        const grownWidth = Math.ceil(rect.width * (prefersReducedMotion() ? 1 : NAME_GROWTH));
        popover.style.left = `${rect.left - inset}px`;
        popover.style.top = `${rect.top - inset}px`;
        // As wide as the mark and the name; only the bare mark on a phone needs a wider box.
        popover.style.width = `${rect.width < NARROW_TRIGGER ? NARROW_BOX_WIDTH : grownWidth + inset * 2}px`;
        popover.style.setProperty("--unfold-from", `${rect.height + inset * 2}px`);
        // The name under the box is hidden while it is open, so focus moves to its copy on top.
        headerRef.current?.focus({ preventScroll: true });
      } else if (!document.activeElement || document.activeElement === document.body || popover?.contains(document.activeElement)) {
        // The browser cannot hand focus back to a name that was hidden, so it is returned here.
        requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
      }
      setIsOpen(opening);
      if (!opening) setAddRequested(false);
    }
    popover.addEventListener("toggle", handleToggle);
    return () => popover.removeEventListener("toggle", handleToggle);
  }, []);

  function choose(organizationId: string) {
    setSelectedId(organizationId);
    popoverRef.current?.hidePopover();
  }

  const name = (
    <>
      <OrganizationMark organizationName={selected?.name ?? ""} />
      <ChevronRightIcon
        className={`size-3.5 shrink-0 text-ink-muted transition-transform duration-200 ease-emphasized motion-reduce:transition-none ${
          isOpen ? "-rotate-90" : "rotate-90"
        }`}
      />
    </>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={POPOVER_ID}
        className={`${touchTargetClass} ${nameRowClass} relative -mx-1.5 transition-[scale,background-color] duration-200 ease-emphasized hover:bg-surface-raised motion-reduce:transition-colors ${
          isOpen ? "invisible scale-105 motion-reduce:scale-100" : ""
        }`}
      >
        {name}
        <span className="sr-only">, switch organization</span>
      </button>

      <div
        ref={popoverRef}
        id={POPOVER_ID}
        popover="auto"
        role="dialog"
        aria-label="Switch organization"
        style={{ "--drop-count": rowCount, padding: BOX_PADDING } as CSSProperties}
        className="glass-panel popover-unfold fixed m-0 rounded-[calc(var(--radius-control)+6px)] text-ink [--unfold-radius:calc(var(--radius-control)+6px)]"
      >
        <button
          ref={headerRef}
          type="button"
          onClick={() => popoverRef.current?.hidePopover()}
          aria-current="true"
          className={`${nameRowClass} scale-105 transition-[scale] duration-200 ease-emphasized starting:scale-100 motion-reduce:scale-100`}
        >
          {name}
          <span className="sr-only">(current), close</span>
        </button>

        {others.length > 0 && (
          <ul aria-label="Other organizations" className="mt-1">
            {others.map((organization, index) => (
              <li key={organization.id} className="drop-item" style={dropIndex(index)}>
                <button
                  type="button"
                  onClick={() => choose(organization.id)}
                  className="flex w-full items-center gap-2.5 rounded-control px-1.5 py-1.5 text-left font-medium transition-colors hover:bg-glass-hover"
                >
                  <span aria-hidden="true" className="size-5 shrink-0 rounded-full bg-linear-135 from-org-from to-org-to" />
                  <span className="min-w-0 flex-1 truncate">{organization.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="drop-item mt-1 border-t border-glass-edge pt-1" style={dropIndex(others.length)}>
          <button
            type="button"
            onClick={() => setAddRequested(true)}
            className="flex w-full items-center gap-2 rounded-control px-1.5 py-1.5 text-left text-xs font-medium whitespace-nowrap transition-colors hover:bg-glass-hover"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-glass-edge">
              <PlusIcon className="size-3 shrink-0" />
            </span>
            Add organization
          </button>
          <p role="status" className="px-1.5 pb-1 text-caption text-ink-muted empty:hidden">
            {addRequested ? "Not available in this prototype." : ""}
          </p>
        </div>
      </div>
    </>
  );
}
