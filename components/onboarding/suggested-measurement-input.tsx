"use client";

import { useLayoutEffect, useRef } from "react";
import { emphasizedEasing, prefersReducedMotion } from "@/components/ui/motion";
import { measurementOverride } from "@/lib/onboarding/suggest-feature-unit";

export function SuggestedMeasurementInput({ suggestion, value, onChange, describedBy }: {
  suggestion: string;
  value: string | null;
  onChange: (value: string | null) => void;
  describedBy: string;
}) {
  const currentRef = useRef<HTMLSpanElement>(null);
  const outgoingRef = useRef<HTMLSpanElement>(null);
  const previousRef = useRef({ suggestion, value });

  useLayoutEffect(() => {
    const previous = previousRef.current;
    previousRef.current = { suggestion, value };
    const current = currentRef.current;
    const outgoing = outgoingRef.current;
    // Manual typing is immediate; only changes to the automatic suggestion move.
    if (!current || !outgoing || value !== null || previous.value !== null || previous.suggestion === suggestion) return;
    outgoing.textContent = previous.suggestion;
    const reduced = prefersReducedMotion();
    const options = { duration: 180, easing: emphasizedEasing() };
    const entering = current.animate([
      { opacity: 0, transform: reduced ? "none" : "translateY(4px)" },
      { opacity: 1, transform: "none" },
    ], options);
    const exiting = outgoing.animate([
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: reduced ? "none" : "translateY(-4px)" },
    ], options);
    return () => { entering.cancel(); exiting.cancel(); };
  }, [suggestion, value]);

  return (
    <div className="relative min-w-0 flex-1">
      <input id="feature-unit" maxLength={40} value={value ?? ""} onChange={(event) => onChange(measurementOverride(event.target.value))} className="onboarding-glass-input w-full px-4 py-3 text-base text-onboarding-ink" aria-describedby={describedBy} />
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 flex items-center overflow-hidden rounded-control px-4 text-base text-onboarding-muted transition-opacity duration-150 ${value === null ? "opacity-100" : "opacity-0"}`}>
        <span ref={outgoingRef} className="absolute opacity-0" />
        <span ref={currentRef}>{suggestion}</span>
      </div>
    </div>
  );
}
