"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CommetLogo } from "@/components/shell/commet-logo";
import { DashboardBuilder } from "@/components/onboarding/dashboard-builder";
import { DissolvingPhrase } from "@/components/onboarding/dissolving-phrase";
import { LiquidGlassSurface } from "@/components/ui/liquid-glass-surface";
import { DitherBackground } from "@/components/onboarding/dither-background";

const PHRASES = ["You build the product.", "We take care of your billing.", "Let’s shape your pricing."];
const READ_TIME = 2100;
const EXIT_TIME = 850;

/** The opening hands off to company setup; navigation and skip cancel pending timers. */
export function OnboardingIntro() {
  const [phrase, setPhrase] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [setupVisible, setSetupVisible] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [nameError, setNameError] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [builderVisible, setBuilderVisible] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [introHeight, setIntroHeight] = useState<number | null>(null);
  const [backgroundPaused, setBackgroundPaused] = useState(false);
  const introRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (transitioning || builderVisible) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function respectPreference() {
      if (preference.matches) {
        setPhrase(PHRASES.length - 1);
        setLeaving(false);
        setSetupVisible(true);
      }
    }
    respectPreference();
    preference.addEventListener("change", respectPreference);
    return () => preference.removeEventListener("change", respectPreference);
  }, [transitioning, builderVisible]);

  useEffect(() => {
    if (transitioning || builderVisible) return;
    if (phrase === PHRASES.length - 1) {
      // Let the last phrase finish entering before it becomes the setup heading.
      const timeout = window.setTimeout(() => setSetupVisible(true), 950);
      return () => window.clearTimeout(timeout);
    }
    const timeout = window.setTimeout(() => {
      if (leaving) {
        setPhrase((current) => current + 1);
        setLeaving(false);
      } else setLeaving(true);
    }, leaving ? EXIT_TIME : READ_TIME);
    return () => window.clearTimeout(timeout);
  }, [phrase, leaving, transitioning, builderVisible]);

  useEffect(() => {
    if (!transitioning) return;
    const timeout = window.setTimeout(() => {
      setIntroDismissed(true);
      setTransitioning(false);
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : EXIT_TIME);
    return () => window.clearTimeout(timeout);
  }, [transitioning]);

  function startBuilding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (transitioning) return;
    if (!companyName.trim()) {
      setNameError("Give your company a name to continue.");
      inputRef.current?.focus();
      return;
    }
    setCompanyName(companyName.trim());
    setNameError("");
    setTransitioning(true);
    setIntroHeight(introRef.current?.offsetHeight ?? null);
    setBuilderVisible(true);
  }

  function skip() {
    setLeaving(false);
    setPhrase(PHRASES.length - 1);
    setSetupVisible(true);
  }

  const text = PHRASES[phrase];
  const complete = phrase === PHRASES.length - 1;

  return (
    <section className="onboarding-stage relative isolate flex min-h-dvh flex-col overflow-hidden px-6 text-onboarding-ink sm:px-10">
      <div aria-hidden="true" className={`onboarding-glow pointer-events-none absolute inset-0 -z-10 ${builderVisible ? "is-builder" : ""}`} />
      <div aria-hidden="true" className={`onboarding-workspace-light pointer-events-none absolute inset-0 -z-10 ${builderVisible ? "is-visible" : ""}`} />
      {builderVisible && <DitherBackground paused={backgroundPaused} />}
      <header className="flex items-center justify-between gap-6 py-7 sm:py-9">
        <Link href="/" className="onboarding-control text-base font-semibold tracking-tight" aria-label="Commet, back to Nimbus">
          <CommetLogo className="bg-onboarding-ink" />
          <span>Commet<span className="text-onboarding-dollar">.</span></span>
        </Link>
        {!complete && <button type="button" onClick={skip} className="onboarding-control text-sm text-onboarding-muted">Skip intro <span aria-hidden="true">↗</span></button>}
        {builderVisible && <div className="flex min-w-0 items-center gap-4"><button type="button" onClick={() => setBackgroundPaused((paused) => !paused)} className="onboarding-control text-xs text-onboarding-muted motion-reduce:hidden">{backgroundPaused ? "Resume background" : "Pause background"}</button><span className="onboarding-company-badge max-w-40 truncate text-sm text-onboarding-muted">{companyName}</span></div>}
      </header>

      <div className="relative min-h-[32rem] flex-1">
      {builderVisible && <div inert={transitioning}><DashboardBuilder companyName={companyName} ready={!transitioning} /></div>}
      {!introDismissed && <div ref={introRef} inert={transitioning} aria-hidden={transitioning || undefined} style={transitioning && introHeight !== null ? { height: introHeight } : undefined} className={`${builderVisible ? "absolute inset-x-0 top-0" : "relative h-full"} min-h-[32rem] text-center`}>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        <div className={`onboarding-heading flex flex-col items-center ${setupVisible ? "is-setting-up" : ""}`}>
        <p className={`mb-8 text-xs tracking-[0.2em] text-onboarding-muted uppercase transition-opacity duration-200 ${transitioning ? "opacity-0" : ""}`}>Your next chapter</p>
        <h1 className="onboarding-intro-title w-full max-w-5xl leading-[1.12] font-medium tracking-[-0.045em]">
          <span className="sr-only">Set up your organization’s pricing</span>
          <DissolvingPhrase key={phrase} text={text} leaving={leaving || transitioning} />
        </h1>
        </div>
        </div>
        {setupVisible && (
          <form onSubmit={startBuilding} className={`onboarding-company-field absolute inset-x-0 top-1/2 mx-auto mt-8 max-w-md text-left ${transitioning ? "is-submitted" : ""}`}>
            <label htmlFor="company-name" className="mb-3 block text-sm text-onboarding-muted">What’s your company called?</label>
            <LiquidGlassSurface>
            <input
              ref={inputRef}
              id="company-name"
              name="organization"
              type="text"
              autoComplete="organization"
              required
              maxLength={80}
              placeholder="Your company name"
              value={companyName}
              onChange={(event) => { setCompanyName(event.target.value); setNameError(""); }}
              aria-describedby={nameError ? "company-name-error" : "company-name-hint"}
              aria-invalid={!!nameError}
              className="min-w-0 flex-1 rounded-control bg-transparent px-4 py-4 text-xl text-onboarding-ink outline-none placeholder:text-onboarding-muted sm:text-2xl"
            />
            <button type="submit" aria-label="Continue with this company name" className="liquid-glass-submit flex size-11 shrink-0 items-center justify-center rounded-full text-xl">↵</button>
            </LiquidGlassSurface>
            {nameError ? <p id="company-name-error" role="alert" className="mt-3 text-sm text-critical">{nameError}</p> : <p id="company-name-hint" className="mt-3 text-xs text-onboarding-muted">Press Enter to build your dashboard.</p>}
          </form>
        )}
      </div>}
      </div>
      <footer className="flex items-center justify-between gap-4 pb-7 text-xs text-onboarding-muted sm:pb-9">
        <span>Built around your product.</span>
        {!builderVisible && <span aria-hidden="true" className="flex gap-2">
          {PHRASES.map((_, index) => <span key={index} className={`size-1.5 rounded-full transition-opacity duration-200 ${index === phrase ? "bg-onboarding-ink" : "bg-onboarding-muted opacity-30"}`} />)}
        </span>}
      </footer>
    </section>
  );
}
