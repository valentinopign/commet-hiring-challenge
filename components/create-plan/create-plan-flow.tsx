"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { PositionStep } from "@/components/create-plan/position-step";
import { StepFooter } from "@/components/create-plan/step-footer";
import { StepList } from "@/components/create-plan/step-list";
import { StepPlaceholder } from "@/components/create-plan/step-placeholder";
import { createInitialState, draftFlowReducer } from "@/lib/create-plan/draft-reducer";
import {
  CREATE_PLAN_STEPS,
  firstIncompleteStep,
  resolveStep,
  stepIndex,
  validateStep,
  type ExistingPlan,
  type StepId,
} from "@/lib/create-plan/steps";
import type { DraftBase } from "@/lib/derive/types";

type CreatePlanFlowProps = {
  bases: DraftBase[];
  initialBaseCode: string | null;
  existingPlans: ExistingPlan[];
  currency: string;
};

/**
 * Writes one search param without a server round trip. Next keeps `useSearchParams` in sync with
 * `history.pushState`, so the browser's Back button moves between steps instead of leaving the flow.
 */
function writeSearchParam(name: string, value: string | null, mode: "push" | "replace") {
  const params = new URLSearchParams(window.location.search);
  if (value === null) params.delete(name);
  else params.set(name, value);
  const url = `${window.location.pathname}?${params.toString()}`;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

/**
 * The client boundary of the create flow: every step and the ladder read the same draft, so the
 * state lives here. The step comes from the URL and is clamped to the furthest step the draft
 * allows, which also covers a reload (the draft is not persisted, so it starts over).
 */
export function CreatePlanFlow({ bases, initialBaseCode, existingPlans, currency }: CreatePlanFlowProps) {
  const [state, dispatch] = useReducer(
    draftFlowReducer,
    bases.find((base) => base.code === initialBaseCode) ?? null,
    createInitialState,
  );
  const requestedStep = useSearchParams().get("step");
  const step = resolveStep(requestedStep, state, existingPlans);
  const furthest = firstIncompleteStep(state, existingPlans);
  const index = stepIndex(step);

  // Errors stay hidden until the person tries to continue; after that they update as they type.
  const [attemptedStep, setAttemptedStep] = useState<StepId | null>(null);
  const issues = validateStep(step, state, existingPlans);
  const showAllIssues = attemptedStep === step;

  // A clamped step (a hand-edited URL, a reload) rewrites the URL so it matches what is shown.
  useEffect(() => {
    if (requestedStep !== null && requestedStep !== step) writeSearchParam("step", step, "replace");
  }, [requestedStep, step]);

  // Focus follows the step so keyboard and screen reader users land on its title, not the footer.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  function goTo(target: StepId) {
    setAttemptedStep(null);
    writeSearchParam("step", target, "push");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const [firstIssue] = issues;
    if (firstIssue) {
      // Render the errors first so the field is already described by its error when it gets focus.
      flushSync(() => setAttemptedStep(step));
      document.getElementById(firstIssue.field)?.focus();
      return;
    }
    const next = CREATE_PLAN_STEPS[index + 1];
    if (next) goTo(next.id);
  }

  const previous = CREATE_PLAN_STEPS[index - 1];
  const isLastStep = index === CREATE_PLAN_STEPS.length - 1;

  return (
    <div className="space-y-6">
      <StepList current={step} furthest={furthest} onSelect={goTo} />

      <form noValidate onSubmit={handleSubmit} aria-labelledby="step-heading" className="max-w-3xl">
        <p className="text-caption text-ink-muted">
          Step {index + 1} of {CREATE_PLAN_STEPS.length}
        </p>
        <h2
          id="step-heading"
          ref={headingRef}
          tabIndex={-1}
          className="mb-4 text-xl font-semibold tracking-tight focus:outline-none"
        >
          {CREATE_PLAN_STEPS[index].title}
        </h2>

        {step === "position" ? (
          <PositionStep
            state={state}
            dispatch={dispatch}
            bases={bases}
            currency={currency}
            issues={issues}
            showAllIssues={showAllIssues}
            onBaseChange={(code) => writeSearchParam("from", code, "replace")}
          />
        ) : (
          <StepPlaceholder />
        )}

        <StepFooter
          onBack={previous ? () => goTo(previous.id) : null}
          continueLabel={isLastStep ? null : "Continue"}
        />
      </form>
    </div>
  );
}
