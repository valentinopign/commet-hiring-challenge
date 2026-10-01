"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CreatePlanFlow } from "@/components/create-plan/create-plan-flow";
import type { Catalog, CatalogFeature, Plan } from "@/lib/catalog";
import { DashboardPreview } from "@/components/onboarding/dashboard-preview";
import { StepTransition } from "@/components/create-plan/step-transition";
import { suggestFeatureUnit } from "@/lib/onboarding/suggest-feature-unit";
import { SuggestedMeasurementInput } from "@/components/onboarding/suggested-measurement-input";
import { addOnboardingPlan } from "@/lib/onboarding/add-plan";
import type { DraftPlan } from "@/lib/derive/types";
import { PlanCollection } from "@/components/onboarding/plan-collection";

const FEATURE_TYPES = [
  { type: "credit", title: "An action", example: "Generations, API calls, renders", description: "Uses credits each time a customer does something." },
  { type: "capacity", title: "A capacity", example: "Seats, storage, workspaces", description: "Includes a limit, with rules for going over it." },
  { type: "boolean", title: "An access", example: "SSO, support, data export", description: "Something a plan either includes or doesn’t." },
] as const;

export function DashboardBuilder({ companyName, ready = true }: { companyName: string; ready?: boolean }) {
  const [features, setFeatures] = useState<CatalogFeature[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [finished, setFinished] = useState(false);
  const [type, setType] = useState<CatalogFeature["type"]>("credit");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [showPlanCollection, setShowPlanCollection] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const nextFeatureId = useRef(1);
  const resolvedUnit = unit ?? suggestFeatureUnit(name, type);
  const stage = creatingPlan ? "plan" : finished ? "dashboard" : showPlanCollection ? "collection" : "product";

  useEffect(() => { if (ready) headingRef.current?.focus({ preventScroll: true }); }, [stage, ready]);

  function addFeature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const featureName = name.trim();
    if (!featureName || (type !== "boolean" && !resolvedUnit.trim())) {
      setError(!featureName ? "Describe what your product offers." : "Enter what you want to count, or use the suggestion.");
      return;
    }
    if (features.some((feature) => feature.name.toLowerCase() === featureName.toLowerCase())) {
      setError("That feature is already on your list.");
      nameRef.current?.focus();
      return;
    }
    const code = `feature_${nextFeatureId.current++}`;
    const feature: CatalogFeature = type === "boolean"
      ? { code, name: featureName, type }
      : { code, name: featureName, type, unit: resolvedUnit.trim() };
    setFeatures((current) => [...current, feature]);
    setName("");
    setUnit(null);
    setError("");
    nameRef.current?.focus();
  }

  const catalog: Catalog = {
    organization: { id: "org_onboarding", name: companyName, description: "", currency: "USD" },
    features, plans, creditPacks: [], subscriptionsByRelease: [],
  };

  function leavePlan() {
    const params = new URLSearchParams(window.location.search);
    params.delete("step");
    params.delete("from");
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
    setCreatingPlan(false);
    setShowPlanCollection(true);
  }

  function startPlan() {
    leavePlan();
    setFinished(false);
    setCreatingPlan(true);
  }

  function savePlan(draft: DraftPlan) {
    setPlans(addOnboardingPlan(catalog, draft, new Date().toISOString()).plans);
    leavePlan();
  }

  if (stage === "collection" || stage === "dashboard") {
    return (
      <div className="onboarding-builder mx-auto w-full max-w-6xl py-8 sm:py-12">
        <p className="mb-3 text-xs tracking-[0.2em] text-onboarding-muted uppercase">{companyName} / {finished ? "Dashboard" : "Your plans"}</p>
        <h1 ref={headingRef} tabIndex={-1} className="mb-4 text-4xl font-medium tracking-tight outline-none sm:text-5xl">{finished ? "Your dashboard is ready." : "Your plans."}</h1>
        <StepTransition key={stage} direction="forward">
          {finished ? <>
            <p role="status" className="mb-8 text-onboarding-muted">Setup complete. This is a local demo: reloading clears your company setup.</p>
            <DashboardPreview catalog={catalog} completed />
            <button type="button" onClick={() => setFinished(false)} className="onboarding-glass-button mt-8 min-h-11 px-5 py-3 text-sm font-medium">Back to your plans</button>
          </> : <PlanCollection catalog={catalog} onAdd={startPlan} onFinish={() => setFinished(true)} onBack={plans.length ? undefined : () => setShowPlanCollection(false)} />}
        </StepTransition>
      </div>
    );
  }

  return (
    <div className="onboarding-builder mx-auto w-full max-w-6xl py-8 sm:py-12">
      <p className="mb-3 text-xs tracking-[0.2em] text-onboarding-muted uppercase">{companyName} / {creatingPlan ? plans.length ? "Another plan" : "First plan" : "Your product"}</p>
      <h1 ref={headingRef} tabIndex={-1} className="mb-4 text-4xl font-medium tracking-tight outline-none sm:text-5xl">
        <span key={String(creatingPlan)} className="onboarding-builder-title inline-block">{creatingPlan ? "Create a plan." : "What does your product offer?"}</span>
      </h1>
      <StepTransition key={String(creatingPlan)} direction={creatingPlan ? "forward" : "back"}>
      {creatingPlan ? (
        <>
          <button type="button" className="onboarding-control mb-5 text-sm text-onboarding-muted" onClick={leavePlan}>← Back to your plans</button>
          <p className="mb-6 text-sm text-onboarding-muted">This plan will join your collection. You can add more before finishing setup.</p>
          <CreatePlanFlow catalog={catalog} initialBaseCode={null} onPublish={savePlan} onCancel={leavePlan} />
        </>
      ) : (
        <>
          <p className="mb-10 max-w-xl text-base leading-relaxed text-onboarding-muted">Start with what customers can do, how much they can use, and what they can access. You’ll set the prices in your first plan.</p>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
            <div>
              <fieldset className="grid gap-3 sm:grid-cols-3">
                <legend className="sr-only">Feature type</legend>
                {FEATURE_TYPES.map((option) => (
                  <label key={option.type} className="onboarding-feature-option cursor-pointer rounded-card border border-onboarding-muted/30 p-4 has-checked:border-onboarding-ink/70 has-checked:bg-onboarding-ink/5">
                    <input type="radio" name="feature-type" value={option.type} checked={type === option.type} onChange={() => { setType(option.type); setUnit(null); setError(""); }} className="mb-5 accent-onboarding-dollar" />
                    <span className="block text-base font-medium">{option.title}</span>
                    <span className="mt-2 block text-sm leading-relaxed text-onboarding-muted">{option.description}</span>
                    <span className="mt-4 block text-xs leading-relaxed text-onboarding-muted">{option.example}</span>
                  </label>
                ))}
              </fieldset>
              <form onSubmit={addFeature} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="feature-name" className="mb-2 block text-sm text-onboarding-muted">{type === "credit" ? "What can your customer do?" : type === "capacity" ? "What do you want to limit?" : "What can your customer access?"}</label>
                  <input ref={nameRef} id="feature-name" required maxLength={80} value={name} onChange={(event) => { setName(event.target.value); if (!event.target.value.trim()) setUnit(null); setError(""); }} placeholder={type === "credit" ? "e.g. Generate an image" : type === "capacity" ? "e.g. Users, storage, workspaces" : "e.g. Priority support"} className="onboarding-glass-input w-full px-4 py-3 text-base" aria-describedby={error ? "feature-error" : undefined} aria-invalid={!!error} />
                </div>
                {type !== "boolean" && <div className="space-y-2 text-sm text-onboarding-muted">
                  <label htmlFor="feature-unit" className="block">{type === "credit" ? "Charge credits for each" : "Measure the limit in"}</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <SuggestedMeasurementInput suggestion={suggestFeatureUnit(name, type)} value={unit} onChange={(value) => { setUnit(value); setError(""); }} describedBy={`feature-unit-hint${error ? " feature-error" : ""}`} />
                    <button type="button" disabled={unit !== null} onClick={() => { setUnit(resolvedUnit); setError(""); }} className="onboarding-glass-button min-h-11 px-4 py-3 font-medium disabled:cursor-default disabled:opacity-60"><span>{unit === null ? "Use suggestion" : "Confirmed"}</span><span aria-hidden="true" className={`inline-block overflow-hidden align-middle transition-opacity duration-150 ${unit === null ? "opacity-0" : "opacity-100"}`}> ✓</span></button>
                  </div>
                  <p id="feature-unit-hint">{unit === null ? `Suggested: ${resolvedUnit}. Accept it or type your own.` : "You can edit this measurement anytime."} You’ll set the {type === "credit" ? "credit cost" : "amount"} in your plan.</p>
                </div>}
                {error && <p id="feature-error" role="alert" className="text-sm text-critical">{error}</p>}
                <button type="submit" className="onboarding-glass-button min-h-11 px-5 py-3 text-sm font-medium">Add feature <span aria-hidden="true">+</span></button>
              </form>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button type="button" onClick={() => setShowPlanCollection(true)} className="min-h-11 rounded-control bg-onboarding-ink px-5 py-3 text-sm font-medium text-onboarding-canvas">Continue to your plans <span aria-hidden="true">→</span></button>
                <span className="text-xs text-onboarding-muted">Billing currency: USD</span>
              </div>
            </div>
            <DashboardPreview catalog={catalog} onRemove={(code) => setFeatures((current) => current.filter((feature) => feature.code !== code))} />
          </div>
        </>
      )}
      </StepTransition>
    </div>
  );
}
