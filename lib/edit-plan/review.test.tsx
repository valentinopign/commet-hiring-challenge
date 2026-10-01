import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { catalog } from "@/data/catalog";
import { PlanEditReview } from "@/components/plan-detail/plan-edit-review";
import { MigrationVersionSelector } from "@/components/plan-detail/migration-version-selector";
import { PlanDetailHistory } from "@/components/plan-detail/plan-detail-history";
import { PlanEditBar } from "@/components/plan-detail/plan-edit-bar";
import { MigrationEntryLink } from "@/components/plan-detail/migration-entry-link";
import { getPlanDetail } from "@/lib/derive/plan-detail";
import { createEditState, derivePlanChanges, editPlanReducer } from "./changes";
import { publishPlanEdit } from "./publication";

vi.mock("@/components/organizations/catalog-link", () => ({ default: ({ children, scroll: _scroll, ...props }: { children: ReactNode; scroll?: boolean }) => createElement("a", props, children) }));

const fixture = catalog.plans.find((plan) => plan.code === "growth");
if (!fixture) throw new Error("Missing fixture");
const plan = fixture;
const featureState = editPlanReducer(createEditState(catalog, plan), { type: "set_feature", code: "ai_generation", feature: { code: "ai_generation", type: "credit", creditsPerUnit: 99 } });

describe("review and scheduled migration visibility", () => {
  it("shows separate impact scopes and optional source versions unchecked by default", () => {
    const state = editPlanReducer(featureState, { type: "set_price", interval: "monthly", price: 10000 });
    const html = renderToStaticMarkup(<PlanEditReview catalog={catalog} plan={plan} state={state} changes={derivePlanChanges(catalog, plan, state.draft)} schedules={[]} onClose={vi.fn()} onPublish={vi.fn()} />);
    expect(html).toContain("Feature version · new customers");
    expect(html).toContain("all 398 customers across all versions at their next renewal");
    expect(html).toContain("Move existing customers to v4");
    expect(html.match(/type="checkbox"/g)).toHaveLength(3);
    expect(html).not.toContain('checked=""');
    expect(html).toContain('aria-labelledby="plan-dialog-title"');
    expect(html).toContain("Plan checks");
  });
  it("offers migration to the current version without promising a new release for price-only changes", () => {
    const state = editPlanReducer(createEditState(catalog, plan), { type: "set_price", interval: "monthly", price: 10000 });
    const html = renderToStaticMarkup(<PlanEditReview catalog={catalog} plan={plan} state={state} changes={derivePlanChanges(catalog, plan, state.draft)} schedules={[]} onClose={vi.fn()} onPublish={vi.fn()} />);
    expect(html).toContain("Plan updated; no new version");
    expect(html).toContain("Move existing customers to v3");
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    expect(html).not.toContain('checked=""');
  });
  it("reviews migration-only selections with their source diffs and no new version", () => {
    const state = createEditState(catalog, plan);
    const html = renderToStaticMarkup(<PlanEditReview catalog={catalog} plan={plan} state={state} changes={derivePlanChanges(catalog, plan, state.draft)} schedules={[]} selectedVersions={[1, 2]} targetVersion={3} onSelectionChange={vi.fn()} onClose={vi.fn()} onPublish={vi.fn()} />);
    expect(html).toContain("Moves 352 customers from v1 and v2 to v3 at their next renewal; no new version");
    expect(html).toContain("2 effective changes");
    expect(html.match(/checked=""/g)).toHaveLength(2);
    expect(html).toContain("v1 → v3");
    expect(html).toContain("v2 → v3");
    expect(html).toContain("Schedule moves");
    expect(html).not.toContain("Publish changes</button>");
  });
  it("counts selected sources and enables Review for migration-only editing", () => {
    const state = createEditState(catalog, plan);
    const changes = derivePlanChanges(catalog, plan, state.draft);
    const html = renderToStaticMarkup(<PlanEditBar changes={changes} migrationCount={2} migrationCustomers={352} targetVersion={3} onDiscard={vi.fn()} onReview={vi.fn()} invalid={false} onHeightChange={vi.fn()} />);
    expect(html).toContain("2 changes");
    expect(html).toContain("352 customers will be scheduled to move to v3 at renewal");
    expect(html).not.toContain('disabled=""');
    expect(renderToStaticMarkup(<PlanEditBar changes={changes} onDiscard={vi.fn()} onReview={vi.fn()} invalid={false} onHeightChange={vi.fn()} />)).toContain('disabled=""');
  });
  it("links the retired alert and populated retired sources to current editing with focus/preselection query state", () => {
    const detail = getPlanDetail(catalog, "growth");
    if (!detail) throw new Error("Missing fixture");
    const html = renderToStaticMarkup(<PlanDetailHistory catalog={catalog} detail={detail} />);
    expect(html).toContain('edit=instant&amp;migrate=all#customer-migration');
    expect(html).toContain('edit=instant&amp;migrate=1#customer-migration');
    expect(html).toContain('edit=instant&amp;migrate=2#customer-migration');
    expect(html).not.toContain('edit=instant&amp;migrate=3#customer-migration');
    expect(html).toContain('aria-label="Migrate customers from v1"');
    const entry = renderToStaticMarkup(<MigrationEntryLink planCode="growth" currentVersion={3} sourceVersion={2} />);
    expect(entry).toContain('/plans/growth?version=3&amp;edit=instant&amp;migrate=2#customer-migration');
  });
  it("shows the selected source-to-target diff and explicitly highlights worse changes", () => {
    const html = renderToStaticMarkup(<MigrationVersionSelector catalog={catalog} plan={plan} targetVersion={4} targetFeatures={featureState.draft.features} schedules={[]} selectedVersions={[1, 2]} onChange={vi.fn()} />);
    expect(html.match(/checked=""/g)).toHaveLength(2);
    expect(html).toContain("v1 → v4");
    expect(html).toContain("v2 → v4");
    expect(html).toContain("Worse for these customers");
    expect(html).toContain("Worse for customers");
    expect(html).toContain("99 credits");
  });
  it("keeps current customer counts, with pending moves in every source timeline and the alert", () => {
    const result = publishPlanEdit(catalog, [], { original: plan, state: featureState, selectedVersions: [1, 2], scheduledAt: "2026-10-01T16:00:00Z" });
    if (!result.ok) throw new Error(result.reason);
    const detail = getPlanDetail(result.publication.catalog, "growth");
    if (!detail) throw new Error("Missing updated detail");
    const html = renderToStaticMarkup(<PlanDetailHistory catalog={result.publication.catalog} detail={detail} schedules={result.publication.schedules} />);
    expect(html).toContain("12 customers scheduled to move to v4 at renewal");
    expect(html).toContain("340 customers scheduled to move to v4 at renewal");
    expect(html).toContain("352 of 398 are scheduled to move to v4 at renewal");
    expect(html).toContain("46 customers on retired versions are staying on their version");
    expect(detail.plan.totalSubscriptions).toBe(398);
    expect(detail.timeline.find((entry) => entry.version === 4)?.subscriptions).toBe(0);
  });
});
