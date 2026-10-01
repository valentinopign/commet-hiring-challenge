import type { Catalog } from "@/lib/catalog";
import { PreviewFeatureRow } from "@/components/onboarding/preview-feature-row";
import { getPlanLadder } from "@/lib/derive/plans";
import { formatCredits, formatMoney } from "@/lib/format";

/** An honest empty dashboard: features arrive as configured, plans and customers start at zero. */
export function DashboardPreview({ catalog, onRemove, completed = false, showPlans = true }: { catalog: Catalog; onRemove?: (code: string) => void; completed?: boolean; showPlans?: boolean }) {
  const hasFeatures = catalog.features.length > 0;
  const plans = getPlanLadder(catalog);
  return (
    <section aria-labelledby="dashboard-preview-title" className="onboarding-preview overflow-hidden rounded-sheet border border-onboarding-muted/25 lg:sticky lg:top-8">
      <div className="flex items-center justify-between gap-4 border-b border-onboarding-muted/20 px-5 py-4">
        <h2 id="dashboard-preview-title" className="truncate text-sm font-medium">{catalog.organization.name}</h2>
        <span className="text-xs text-onboarding-muted">{completed ? "Local demo" : "Dashboard preview"}</span>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="mb-5 text-xl font-medium tracking-tight">Overview</h3>
        <dl className="mb-8 grid grid-cols-3 gap-3">
          {[{ label: "Customers", value: 0 }, { label: "Plans", value: catalog.plans.length }, { label: "Features", value: catalog.features.length }].map((stat) => <div key={stat.label} className="rounded-control border border-onboarding-muted/20 p-3"><dt className="text-xs text-onboarding-muted">{stat.label}</dt><dd className="mt-3 text-2xl tabular-nums"><span key={stat.value} className="onboarding-preview-number inline-block">{stat.value}</span></dd></div>)}
        </dl>
        <h3 className="mb-3 text-sm font-medium">Your product</h3>
        {hasFeatures ? <ul>{catalog.features.map((feature) => <PreviewFeatureRow key={feature.code} feature={feature} onRemove={onRemove} />)}</ul> : (
          <div className="rounded-card border border-dashed border-onboarding-muted/30 p-6 text-center text-sm leading-relaxed text-onboarding-muted">Your features will appear here.<br />Add the first piece of your product.</div>
        )}
        {showPlans && plans.length > 0 && <div className="mt-6">
          <h3 className="mb-3 text-sm font-medium">Your plans</h3>
          <ul className="space-y-2">{plans.map((plan) => <li key={plan.code} className="rounded-control border border-onboarding-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{plan.name}</span><span className="text-xs text-onboarding-muted">{plan.isPublic ? "Public" : "Private"} · v1</span></div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-onboarding-muted">
              {plan.monthly && <span>{formatMoney(plan.monthly.price, catalog.organization.currency)} / mo · {formatCredits(plan.monthly.includedCredits)}</span>}
              {plan.yearly && <span>{formatMoney(plan.yearly.price, catalog.organization.currency)} / yr · {formatCredits(plan.yearly.includedCredits)}</span>}
            </div>
          </li>)}</ul>
        </div>}
        <p role="status" className="mt-5 text-xs text-onboarding-muted">{plans.length ? `${plans.length} ${plans.length === 1 ? "plan" : "plans"} configured. No customers yet.` : hasFeatures ? `${catalog.features.length} ${catalog.features.length === 1 ? "feature" : "features"} ready for your first plan.` : "Nothing configured yet."}</p>
      </div>
    </section>
  );
}
