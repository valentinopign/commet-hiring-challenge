"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { DraftLadderPanel } from "@/components/create-plan/draft-ladder-panel";
import { ExhaustionStep } from "@/components/create-plan/exhaustion-step";
import { FeaturesStep } from "@/components/create-plan/features-step";
import type { CreatePlanData, DraftDerived, StepProps } from "@/components/create-plan/flow-data";
import { PositionStep } from "@/components/create-plan/position-step";
import { PricingStep } from "@/components/create-plan/pricing-step";
import { PublishConfirmation } from "@/components/create-plan/publish-confirmation";
import { ReviewStep } from "@/components/create-plan/review-step";
import { StepFooter } from "@/components/create-plan/step-footer";
import { StepList } from "@/components/create-plan/step-list";
import { StepTransition, type StepDirection } from "@/components/create-plan/step-transition";
import { useDraftLadder } from "@/components/create-plan/use-draft-ladder";
import type { Catalog } from "@/lib/catalog";
import { createInitialState, draftFlowReducer, getPlacedMonthlyPrice, getResolvedDraft } from "@/lib/create-plan/draft-reducer";
import {
  CREATE_PLAN_STEPS,
  firstIncompleteStep,
  resolveStep,
  stepIndex,
  validateStep,
  type StepId,
} from "@/lib/create-plan/steps";
import { summarizeCreditPacks } from "@/lib/derive/credit-packs";
import {
  getDraftBases,
  getDraftPosition,
  getYearlyReference,
  groupWarningsBySeverity,
  suggestCreditPacks,
} from "@/lib/derive/draft-flow";
import { getPlanLadder, getPlanNames, summarizeDraft } from "@/lib/derive/plans";
import { checkDraftPlan } from "@/lib/derive/sanity-checks";

type CreatePlanFlowProps = {
  catalog: Catalog;
  initialBaseCode: string | null;
};

function deriveData(catalog: Catalog): CreatePlanData {
  const ladder = getPlanLadder(catalog);
  return {
    catalog,
    currency: catalog.organization.currency,
    ladder,
    bases: getDraftBases(catalog),
    existingPlans: catalog.plans.map(({ code, name }) => ({ code, name })),
    planNames: getPlanNames(catalog),
    yearlyReference: getYearlyReference(ladder),
    packs: summarizeCreditPacks(catalog),
  };
}

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
export function CreatePlanFlow({ catalog, initialBaseCode }: CreatePlanFlowProps) {
  const data = useMemo(() => deriveData(catalog), [catalog]);
  const { bases, existingPlans, currency, ladder } = data;
  const [state, dispatch] = useReducer(
    draftFlowReducer,
    bases.find((base) => base.code === initialBaseCode) ?? null,
    createInitialState,
  );
  const requestedStep = useSearchParams().get("step");
  const step = resolveStep(requestedStep, state, existingPlans);
  const furthest = firstIncompleteStep(state, existingPlans);
  const index = stepIndex(step);

  // Which way the last step change went, so the new step enters from that side. Adjusting state
  // while rendering: the step comes from the URL, so there is no event handler to set it in.
  const [shownStep, setShownStep] = useState(step);
  const [direction, setDirection] = useState<StepDirection | null>(null);
  if (step !== shownStep) {
    setDirection(index > stepIndex(shownStep) ? "forward" : "back");
    setShownStep(step);
  }

  // Errors stay hidden until the person tries to continue; after that they update as they type.
  const [attemptedStep, setAttemptedStep] = useState<StepId | null>(null);
  const issues = validateStep(step, state, existingPlans);
  const showAllIssues = attemptedStep === step;

  // Everything below is recomputed on each edit: the checks are what the steps react to live.
  const placedPrice = getPlacedMonthlyPrice(state);
  const position = getDraftPosition(ladder, placedPrice);
  const packSuggestion = suggestCreditPacks(data.packs, position);
  const draft = getResolvedDraft(state, packSuggestion.codes);
  const derived: DraftDerived = {
    draft,
    summary: summarizeDraft(catalog, draft),
    position,
    warnings: checkDraftPlan(draft, catalog),
    packSuggestion,
  };
  const stepProps: StepProps = { state, dispatch, data, derived, issues, showAllIssues };
  const ladderView = useDraftLadder(ladder, derived.summary, placedPrice);
  const blockingCount = groupWarningsBySeverity(derived.warnings).blocking.length;
  const [isPublished, setIsPublished] = useState(false);

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
    if (step === "review") {
      if (blockingCount === 0) setIsPublished(true);
      return;
    }
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

  function createAnother() {
    dispatch({ type: "reset", base: null });
    setIsPublished(false);
    writeSearchParam("from", null, "replace");
    goTo("position");
  }

  const previous = CREATE_PLAN_STEPS[index - 1];
  const isReview = step === "review";
  const draftPricePending = placedPrice === null;

  if (isPublished) {
    return (
      <PublishConfirmation
        planName={state.draft.name}
        entries={ladderView.entries}
        positionText={ladderView.positionText}
        currency={currency}
        onCreateAnother={createAnother}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StepList current={step} furthest={furthest} onSelect={goTo} />
      {/* One announcement for both layouts of the ladder, only when the place changes. */}
      <p aria-live="polite" className="sr-only">{ladderView.positionText}</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <DraftLadderPanel view={ladderView} draftPricePending={draftPricePending} currency={currency} variant="collapsible" />

          <form noValidate onSubmit={handleSubmit} aria-labelledby="step-heading" className="max-w-3xl">
            <StepTransition key={step} direction={direction}>
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

              {step === "position" && (
                <PositionStep
                  state={state}
                  dispatch={dispatch}
                  bases={bases}
                  currency={currency}
                  issues={issues}
                  showAllIssues={showAllIssues}
                  onBaseChange={(code) => writeSearchParam("from", code, "replace")}
                />
              )}
              {step === "price" && <PricingStep {...stepProps} />}
              {step === "credits-run-out" && <ExhaustionStep {...stepProps} />}
              {step === "features" && <FeaturesStep {...stepProps} />}
              {isReview && <ReviewStep {...stepProps} onGoToStep={goTo} />}
            </StepTransition>

            <StepFooter
              onBack={previous ? () => goTo(previous.id) : null}
              primaryLabel={isReview ? "Publish plan" : "Continue"}
              primaryDisabled={isReview && blockingCount > 0}
              note={
                isReview
                  ? blockingCount > 0
                    ? "Fix what is marked Must fix to publish."
                    : "Simulated: nothing is saved."
                  : undefined
              }
            />
          </form>
        </div>

        <DraftLadderPanel view={ladderView} draftPricePending={draftPricePending} currency={currency} variant="sidebar" />
      </div>
    </div>
  );
}
