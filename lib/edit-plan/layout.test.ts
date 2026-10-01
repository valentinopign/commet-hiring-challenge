import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { catalog } from "@/data/catalog";
import { CatalogPlanDetail } from "@/components/plan-detail/catalog-plan-detail";
import { EditableFeatures } from "@/components/plan-detail/editable-features";
import { EditCustomerContext } from "@/components/plan-detail/edit-customer-context";
import { getPlanDetail } from "@/lib/derive/plan-detail";
import { createEditState, deriveEditChecks, derivePlanChanges, editPlanReducer } from "./changes";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams("edit=1") }));
vi.mock("@/components/organizations/catalog-link", () => ({ default: ({ children }: { children: ReactNode }) => createElement("a", {}, children) }));

function renderDetail(code: string, version?: string) {
  const detail = getPlanDetail(catalog, code);
  if (!detail) throw new Error("Missing detail fixture");
  return renderToStaticMarkup(createElement(CatalogPlanDetail, { catalog, detail, version, editRequested: true }));
}

describe("inline plan editing markup", () => {
  it("edits the current release with labelled prices, credits, policy and feature controls", () => {
    const html = renderDetail("growth");
    for (const id of ["plan-name", "plan-visibility", "monthly-price", "monthly-credits", "yearly-price", "yearly-credits", "overage-price", "feature-ai_generation-credits", "feature-storage_gb-amount", "feature-storage_gb-unit_price"]) {
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`for="${id}"`);
    }
    expect(html).toContain("API code · locked");
    expect(html).toContain("all 398 customers across all versions");
    expect(html).toContain("existing customers keep their version");
    expect(html).toContain("Discard");
    expect(html).toContain("Review &amp; publish");
    expect(html).toContain("$7.92 / 1,000 credits");
    expect(html).toContain("$6.60 / 1,000 credits");
    expect(html).toContain("Save $198 / yr");
    expect(html).toContain("Neighbour plans");
    expect(html).toContain('Customers by version:');
    expect(html).toContain('Customers on each feature version');
    expect(html).toContain('Who your changes reach');
    expect(html).toContain('No changes yet');
    expect(html).toContain('id="versions-heading"');
    expect(html).toContain('Configure migration');
    expect(html.indexOf('id="customer-migration"')).toBeGreaterThan(html.indexOf('aria-label="Plan edit actions"'));
    expect(html.indexOf('>Configure migration</button>')).toBeLessThan(html.indexOf('>Review &amp; publish</button>'));
    expect(html).not.toContain('id="customer-migration-heading"');
    expect(html).not.toContain('id="migration-destination"');
    expect(html).not.toContain("View version");
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("opens current editing when an edit URL names a retired release", () => {
    const html = renderDetail("growth", "2");
    expect(html).toContain("Editing current v3");
    expect(html).not.toContain("View version");
    expect(html).toContain('id="monthly-price"');
    expect(html).toContain("Discard");
  });
  it("lets Free change monthly credits without adding a paid price or yearly billing", () => {
    const html = renderDetail("free");
    expect(html).toContain('id="monthly-credits"');
    expect(html).not.toContain('id="monthly-price"');
    expect(html).not.toContain('id="yearly-price"');
    expect(html).toContain("Billing periods stay unchanged");
  });
  it("keeps capacity controls and independent before/after impacts in their own cells", () => {
    const plan = catalog.plans.find((item) => item.code === "growth");
    if (!plan) throw new Error("Missing plan fixture");
    const edited = editPlanReducer(createEditState(catalog, plan), { type: "set_feature", code: "storage_gb", feature: { code: "storage_gb", type: "capacity", limit: { type: "limited", includedAmount: 300, overage: { type: "blocked" } } } });
    const changes = derivePlanChanges(catalog, plan, edited.draft);
    const html = renderToStaticMarkup(createElement(EditableFeatures, { features: catalog.features, state: edited, dispatch: vi.fn(), changes, comparisons: deriveEditChecks(catalog, plan, edited).comparisons, currency: "USD", currentVersion: 3, issues: [] }));
    const row = html.slice(html.indexOf('>Asset storage</span>'), html.indexOf('>Team seats</span>'));
    expect(row).toContain("250 GB");
    expect(row).toContain("300 GB");
    expect(row).toContain("Better for customers");
    expect(row).toContain("Worse for customers");
    expect(row).toContain("Trade-off");
    expect(row.indexOf('id="feature-storage_gb-amount"')).toBeLessThan(row.indexOf("</td>"));
    expect(row.indexOf('name="overage-storage_gb"')).toBeGreaterThan(row.indexOf("</td>"));
  });
  it("updates customer reach independently for renewal and feature changes, then clears it on revert", () => {
    const plan = catalog.plans.find((item) => item.code === "growth");
    const detail = getPlanDetail(catalog, "growth");
    if (!plan || !detail) throw new Error("Missing fixture");
    const initial = createEditState(catalog, plan);
    const pricing = editPlanReducer(initial, { type: "set_price", interval: "monthly", price: 10000 });
    const features = editPlanReducer(initial, { type: "set_feature", code: "ai_generation", feature: { code: "ai_generation", type: "credit", creditsPerUnit: 4 } });
    const render = (state: typeof initial) => renderToStaticMarkup(createElement(EditCustomerContext, { versions: detail.plan.versionSplit, changes: derivePlanChanges(catalog, plan, state.draft, state.pending) }));
    const pricingHtml = render(pricing);
    expect(pricingHtml).toContain('398 customers · at renewal');
    expect(pricingHtml).not.toContain('New customers receive v4');
    const featureHtml = render(features);
    expect(featureHtml).toContain('New customers receive v4');
    expect(featureHtml).not.toContain('398 customers · at renewal');
    const revertedHtml = render(editPlanReducer(pricing, { type: "set_price", interval: "monthly", price: 9900 }));
    expect(revertedHtml).toContain('No changes yet');
    expect(revertedHtml).not.toContain('New customers receive');
    expect(revertedHtml).not.toContain('at renewal');
  });
});
