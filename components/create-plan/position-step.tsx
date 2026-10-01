"use client";

import { useState, type Dispatch } from "react";
import { FormField } from "@/components/create-plan/form-field";
import { Reveal } from "@/components/create-plan/reveal";
import { WarningIcon } from "@/components/icons/warning-icon";
import { choiceCardClass, inputClass, outlineControlClass, primaryControlClass } from "@/components/ui/control-styles";
import type { DraftFlowAction, DraftFlowState } from "@/lib/create-plan/draft-reducer";
import type { StepIssue } from "@/lib/create-plan/steps";
import type { DraftBase } from "@/lib/derive/types";
import { formatCredits, formatMoney } from "@/lib/format";

type PositionStepProps = {
  state: DraftFlowState;
  dispatch: Dispatch<DraftFlowAction>;
  bases: DraftBase[];
  currency: string;
  issues: StepIssue[];
  /** After a "Continue" with something missing, every problem shows; before, only a typed code is checked. */
  showAllIssues: boolean;
  onBaseChange: (baseCode: string | null) => void;
};

const SCRATCH = "scratch";

function describeBasePrice(base: DraftBase, currency: string): string {
  if (!base.monthly) return "No monthly price";
  return `${formatMoney(base.monthly.price, currency)} / mo · ${formatCredits(base.monthly.includedCredits)}`;
}

export function PositionStep({ state, dispatch, bases, currency, issues, showAllIssues, onBaseChange }: PositionStepProps) {
  const { draft } = state;
  // `undefined`: no replacement waiting for confirmation; `null` stands for "start from scratch".
  const [replacement, setReplacement] = useState<string | null | undefined>(undefined);
  const [customizingCode, setCustomizingCode] = useState(state.codeEditedByHand);

  const issueFor = (field: StepIssue["field"]) => issues.find((issue) => issue.field === field)?.message;
  const nameError = showAllIssues ? issueFor("plan-name") : undefined;
  const codeError = showAllIssues || draft.code !== "" ? issueFor("plan-code") : undefined;

  const selectedBase = bases.find((base) => base.code === draft.basePlanCode) ?? null;
  const replacementName = replacement === undefined
    ? null
    : (bases.find((base) => base.code === replacement)?.name ?? null);

  function applyBase(code: string | null) {
    dispatch({ type: "apply_base", base: bases.find((base) => base.code === code) ?? null });
    onBaseChange(code);
    setReplacement(undefined);
  }

  function chooseBase(value: string) {
    const code = value === SCRATCH ? null : value;
    if (code === draft.basePlanCode) return;
    // Switching bases overwrites price, credits, policy and features: ask first if any were edited.
    if (state.editedSinceBase) setReplacement(code);
    else applyBase(code);
  }

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-ink-muted">
        Name the plan and decide who can see it.{bases.length > 0 && " Starting from an existing plan copies its setup, so you only change what is different."}
      </p>

      <div className="space-y-3">
        <FormField id="plan-name" label="Name" error={nameError}>
          {(control) => (
            <input
              {...control}
              type="text"
              autoComplete="off"
              placeholder="e.g. Growth Plus"
              value={draft.name}
              onChange={(event) => dispatch({ type: "set_name", name: event.target.value })}
              className={inputClass}
            />
          )}
        </FormField>

        <details open={customizingCode || !!codeError} onToggle={(event) => setCustomizingCode(event.currentTarget.open)}>
          <summary className="w-fit cursor-pointer rounded-control py-2 text-caption text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-4">Customize API code</summary>
          <div className="pt-2">
          <FormField
          id="plan-code"
          label="API code"
          error={codeError}
          hint={
            <>
              Used to identify the plan in the API and on invoices. Lowercase with underscores.
              {!state.codeEditedByHand && draft.name !== "" && " Follows the name until you edit it."}
            </>
          }
        >
          {(control) => (
            <input
              {...control}
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="e.g. growth_plus"
              value={draft.code}
              onChange={(event) => dispatch({ type: "set_code", code: event.target.value })}
              className={`${inputClass} font-mono`}
            />
          )}
          </FormField>
          </div>
        </details>
      </div>

      <fieldset>
        <legend className="font-medium">Visibility</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          <label className={choiceCardClass}>
            <input
              type="radio"
              name="visibility"
              checked={draft.isPublic}
              onChange={() => dispatch({ type: "set_visibility", isPublic: true })}
              className="mt-0.5 size-4 shrink-0 accent-live"
            />
            <span>
              <span className="block font-medium">Public</span>
              <span className="block text-caption text-ink-muted">Listed on the pricing page. Anyone can subscribe.</span>
            </span>
          </label>
          <label className={choiceCardClass}>
            <input
              type="radio"
              name="visibility"
              checked={!draft.isPublic}
              onChange={() => dispatch({ type: "set_visibility", isPublic: false })}
              className="mt-0.5 size-4 shrink-0 accent-live"
            />
            <span>
              <span className="block font-medium">Private</span>
              <span className="block text-caption text-ink-muted">Not listed. The team assigns it to specific customers.</span>
            </span>
          </label>
        </div>
      </fieldset>

      {/* A company with no plans yet has nothing to copy: the draft simply starts empty. */}
      {bases.length > 0 && (
        <fieldset aria-describedby="start-from-note">
          <legend className="font-medium">Start from</legend>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {bases.map((base) => (
              <label key={base.code} className={choiceCardClass}>
                <input
                  type="radio"
                  name="start-from"
                  value={base.code}
                  checked={draft.basePlanCode === base.code}
                  onChange={(event) => chooseBase(event.target.value)}
                  className="mt-0.5 size-4 shrink-0 accent-live"
                />
                <span className="min-w-0">
                  <span className="block font-medium">{base.name}</span>
                  <span className="block text-caption text-ink-muted tabular-nums">
                    {describeBasePrice(base, currency)}
                  </span>
                </span>
              </label>
            ))}
            <label className={choiceCardClass}>
              <input
                type="radio"
                name="start-from"
                value={SCRATCH}
                checked={draft.basePlanCode === null}
                onChange={(event) => chooseBase(event.target.value)}
                className="mt-0.5 size-4 shrink-0 accent-live"
              />
              <span>
                <span className="block font-medium">Start from scratch</span>
                <span className="block text-caption text-ink-muted">Set every value yourself.</span>
              </span>
            </label>
          </div>
          <p id="start-from-note" className="mt-2 max-w-prose text-caption text-ink-muted">
            {selectedBase
              ? `Copies price, credits, what happens when credits run out and the features of ${selectedBase.name} v${selectedBase.currentReleaseVersion}, the version new customers get today. You can change everything.`
              : "Every value starts empty."}
          </p>

          {replacement !== undefined && (
            <Reveal className="pt-3">
              <div role="alert" className="rounded-card border border-warning/35 bg-warning-soft p-3">
                <p className="flex items-start gap-2 font-medium">
                  <WarningIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                  Replace your changes?
                </p>
                <p className="mt-1 text-ink-muted">
                  {replacementName
                    ? `Starting from ${replacementName} replaces the price, credits, policy and features you edited with ${replacementName}'s.`
                    : "Starting from scratch clears the price, credits, policy and features you edited."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyBase(replacement)} className={primaryControlClass}>
                    {replacementName ? `Use ${replacementName}'s` : "Clear them"}
                  </button>
                  <button type="button" onClick={() => setReplacement(undefined)} className={outlineControlClass}>
                    Keep my changes
                  </button>
                </div>
              </div>
            </Reveal>
          )}
        </fieldset>
      )}
    </div>
  );
}
