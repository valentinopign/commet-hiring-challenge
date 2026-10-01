import type { Catalog } from "@/lib/catalog";
import { getPlanLadder } from "@/lib/derive/plans";
import { formatCredits, formatMoney } from "@/lib/format";
import { DashboardPreview } from "./dashboard-preview";
import type { RefObject } from "react";

export function PlanCollection({ catalog, onAdd, onFinish, onBack, previewRef, finishing = false }: {
  catalog: Catalog;
  onAdd: () => void;
  onFinish: () => void;
  onBack?: () => void;
  previewRef?: RefObject<HTMLDivElement | null>;
  finishing?: boolean;
}) {
  const plans = getPlanLadder(catalog);
  return (
    <>
      <p data-setup-exit="1" className="mb-8 max-w-xl leading-relaxed text-onboarding-muted">Build your pricing one plan at a time. Add as many as you need, then finish setting up your company.</p>
      {onBack && <button type="button" onClick={onBack} className="onboarding-control mb-5 text-sm text-onboarding-muted">← Back to your features</button>}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
        <div>
          <ul aria-label="Your plans" className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => <li data-setup-exit="2" key={plan.code} className="rounded-card border border-onboarding-muted/25 bg-onboarding-solid p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="break-words text-lg font-medium">{plan.name}</h2><span className="text-xs text-onboarding-muted">{plan.isPublic ? "Public" : "Private"} · v1</span></div>
              {plan.monthly && <><p className="text-2xl font-medium tabular-nums">{formatMoney(plan.monthly.price, catalog.organization.currency)} <span className="text-sm font-normal text-onboarding-muted">/ mo</span></p><p className="mt-2 text-sm text-onboarding-muted">{formatCredits(plan.monthly.includedCredits)} / mo</p></>}
              {plan.yearly && <p className="mt-3 text-xs leading-relaxed text-onboarding-muted">{formatMoney(plan.yearly.price, catalog.organization.currency)} / yr · {formatCredits(plan.yearly.includedCredits)}</p>}
            </li>)}
            <li data-setup-exit="3"><button type="button" onClick={onAdd} className="flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-card border border-dashed border-onboarding-muted/40 p-5 text-onboarding-ink focus-visible:outline-2 focus-visible:outline-offset-4"><span aria-hidden="true" className="text-3xl font-light text-onboarding-muted">+</span><span className="font-medium">Add plan</span><span className="text-sm text-onboarding-muted">{plans.length ? "Expand your pricing" : "Create your first plan"}</span></button></li>
          </ul>
          <div data-setup-exit="0" className="mt-8">
            <button type="button" onClick={onFinish} disabled={!plans.length || finishing} aria-describedby="finish-setup-hint" className="min-h-11 rounded-control bg-onboarding-ink px-5 py-3 text-sm font-medium text-onboarding-canvas disabled:cursor-not-allowed disabled:opacity-40">{finishing ? "Opening dashboard…" : "Finish setup"} <span aria-hidden="true">→</span></button>
            <p id="finish-setup-hint" className="mt-3 text-xs text-onboarding-muted">{plans.length ? "Open your dashboard with these plans and features." : "Add at least one plan to finish setup."}</p>
          </div>
        </div>
        <div data-setup-exit="4" ref={previewRef} className="lg:sticky lg:top-8"><DashboardPreview catalog={catalog} showPlans={false} /></div>
      </div>
    </>
  );
}
