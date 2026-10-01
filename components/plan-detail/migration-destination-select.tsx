"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { PlanRelease } from "@/lib/catalog";
import { CheckIcon } from "@/components/icons/check-icon";
import { ChevronRightIcon } from "@/components/icons/chevron-right-icon";
import { inputClass } from "@/components/ui/control-styles";

export function MigrationDestinationSelect({ destinations, currentVersion, value, onChange }: {
  destinations: PlanRelease[]; currentVersion: number; value: number; onChange: (version: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, destinations.findIndex((release) => release.version === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const label = (version: number) => `v${version} · ${version === currentVersion ? "Current" : "Retired"}`;

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const version = destinations[activeIndex]?.version;
    if (version !== undefined) document.getElementById(`migration-destination-option-${version}`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, destinations]);

  function choose(index: number) {
    const destination = destinations[index];
    if (!destination) return;
    onChange(destination.version);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Tab") { setOpen(false); return; }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if ((event.key === "Enter" || event.key === " ") && open) { choose(activeIndex); return; }
    setOpen(true);
    if (event.key === "Home") setActiveIndex(0);
    else if (event.key === "End") setActiveIndex(destinations.length - 1);
    else if (!open) setActiveIndex(selectedIndex);
    else if (event.key === "ArrowDown") setActiveIndex((index) => Math.min(index + 1, destinations.length - 1));
    else if (event.key === "ArrowUp") setActiveIndex((index) => Math.max(index - 1, 0));
  }

  return <div ref={root} className="relative sm:max-w-64">
    <span id="migration-destination-label" className="mb-1 block text-caption">Destination version</span>
    <button ref={trigger} id="migration-destination" type="button" role="combobox" aria-labelledby="migration-destination-label migration-destination-value"
      aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? "migration-destination-options" : undefined}
      aria-activedescendant={open ? `migration-destination-option-${destinations[activeIndex]?.version}` : undefined}
      className={`${inputClass} flex min-h-11 items-center justify-between gap-3 text-left ${open ? "border-live" : ""}`}
      onKeyDown={handleKey} onClick={() => { setActiveIndex(selectedIndex); setOpen((previous) => !previous); }}>
      <span id="migration-destination-value">{label(value)}</span><ChevronRightIcon className={`size-4 shrink-0 text-ink-muted ${open ? "-rotate-90" : "rotate-90"}`} />
    </button>
    {open && <div id="migration-destination-options" role="listbox" aria-labelledby="migration-destination-label" className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-control border border-line-strong bg-surface-card p-1 shadow-lg">
      {destinations.map((release, index) => <button key={release.version} id={`migration-destination-option-${release.version}`} type="button" role="option" tabIndex={-1} aria-selected={release.version === value}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-mark px-3 py-2 text-left text-sm ${release.version === value ? "bg-live-soft font-medium text-live-ink" : "text-ink"} ${index === activeIndex ? "outline outline-line-strong -outline-offset-2" : ""}`}
        onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(index)}>
        <span>{label(release.version)}</span>{release.version === value && <CheckIcon className="size-4 shrink-0" />}
      </button>)}
    </div>}
  </div>;
}
