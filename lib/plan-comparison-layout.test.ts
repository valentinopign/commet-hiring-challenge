import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { catalog } from "@/data/catalog";
import { CatalogPlanDetail } from "@/components/plan-detail/catalog-plan-detail";
import { ComparisonFeatureTable } from "@/components/plan-detail/comparison-feature-table";
import { PlanHeader } from "@/components/plan-detail/plan-header";
import { getPlanDetail } from "@/lib/derive/plan-detail";
import { scopeCatalogHref } from "@/lib/organization-routes";

const route = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams(route.query) }));
afterEach(() => { route.query = ""; vi.unstubAllGlobals(); });

vi.mock("@/components/organizations/catalog-link", () => ({
  default: ({ href, children, scroll: _scroll, ...props }: { href: string | { pathname: string; query: Record<string, string | number> }; children: ReactNode; scroll?: boolean }) => {
    const target = typeof href === "string" ? href : `${href.pathname}?${new URLSearchParams(Object.entries(href.query).map(([key, value]) => [key, String(value)]))}`;
    return createElement("a", { ...props, href: target }, children);
  },
}));

function renderComparison(props = {}) {
  const detail = getPlanDetail(catalog, "growth");
  if (!detail) throw new Error("Missing fixture");
  return renderToStaticMarkup(createElement(CatalogPlanDetail, { catalog, detail, version: "1", compare: "scale.2", ...props }));
}

describe("comparison detail markup", () => {
  it("prioritizes a live edit URL over comparison and a retired left version", () => {
    route.query = "version=1&compare=scale.2&diff=1&edit=instant";
    const html = renderComparison();
    expect(html).toContain("Editing current v3");
    expect(html).toContain("Configure migration");
    expect(html).not.toContain("Comparing Growth");
    expect(html).not.toContain("Comparison unavailable");
    expect(html).not.toContain("Plan comparison actions");
  });
  it("uses the live browser URL after comparison and editing parameters are cleared", () => {
    vi.stubGlobal("window", {});
    route.query = "version=3";
    const html = renderComparison({ editRequested: true });
    expect(html).toContain('id="edit-plan-action"');
    expect(html).not.toContain("Comparing Growth");
    expect(html).not.toContain('id="monthly-price"');
    expect(html).not.toContain("Comparison unavailable");
  });
  it("supports same-plan version comparisons with shared pricing and labelled feature impacts", () => {
    const detail = getPlanDetail(catalog, "starter");
    if (!detail) throw new Error("Missing fixture");
    const html = renderToStaticMarkup(createElement(CatalogPlanDetail, { catalog, detail, version: "2", compare: "starter.1" }));
    expect(html).toContain("Comparing Starter v2 with Starter v1");
    expect(html).toContain("Other versions");
    expect(html).toContain('href="/plans/starter?version=2&amp;compare=starter.1"');
    expect(html).toContain("Worse for customers");
    expect(html).not.toContain("Comparison unavailable");
    expect(html).not.toContain("more / mo");
    expect(html).not.toContain('id="versions-heading"');
  });
  it("renders the selected left version, split cards, labelled tables and right-hand impact", () => {
    const html = renderComparison();
    expect(html).toContain("Comparing Growth v1 with Scale v2");
    for (const title of ["Customers", "Monthly", "Yearly", "When credits run out", "Credits", "Capacity", "Access"]) expect(html).toContain(title);
    expect(html).toContain("Growth · v1");
    expect(html).toContain("Scale · v2");
    expect(html).toContain("Better for customers");
    expect(html).toContain('scope="row"');
    expect(html).toContain('scope="col"');
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("sm:table-cell");
    expect(html).not.toContain('id="versions-heading"');
    expect(html).not.toContain("today:");
    expect(html).not.toContain("of Growth customers are on retired versions");
    expect(html.indexOf('aria-label="Plan comparison actions"')).toBeGreaterThan(html.indexOf('id="compare-boolean-heading"'));
    expect(html).toContain("fixed inset-x-0 bottom-0");
  });
  it("preserves comparison through left-version navigation and drops it on exit", () => {
    const html = renderComparison({ diff: "1" });
    expect(html).toContain('href="/plans/growth?version=2&amp;compare=scale.2&amp;diff=1"');
    expect(html).toContain('href="/plans/growth?version=1"');
    expect(html).toContain("Only differences: on, show all features");
    expect(html).toContain('href="/plans/growth?version=1&amp;compare=scale.2"');
    expect(html).not.toContain("edit=");
  });
  it("uses native popovers with links to current and retired versions, including private plans", () => {
    const html = renderComparison();
    expect(html).toContain('popover="auto"');
    expect(html).toContain('popoverTarget="compare-plan"');
    expect(html).toContain('href="/plans/growth?version=1&amp;compare=scale.1"');
    expect(html).toContain("Private");
    expect(html).toContain("Retired");
    expect(html).toContain("Current");
    expect(html).toContain('aria-label="Open comparison selector"');
    expect(html.match(/popoverTarget="compare-plan"/g)).toHaveLength(3);
    expect(html).toContain('popoverTargetAction="hide"');
    expect(html).toContain('aria-label="Close comparison selector"');
    expect(html).toContain("fixed inset-y-0 right-0 left-auto");
    expect(html).toContain('aria-current="page"');
  });
  it("falls back to ordinary detail for unavailable targets or an edit request", () => {
    expect(renderComparison({ compare: "does-not-exist.1" })).toContain("Comparison unavailable");
    const editing = renderComparison({ editRequested: true });
    expect(editing).not.toContain("Comparing Growth");
    expect(editing).not.toContain("Comparison unavailable");
    expect(editing).toContain('id="versions-heading"');
    expect(editing).toContain('id="monthly-price"');
    expect(editing).toContain("Editing current v3");
    expect(editing).toContain("Configure migration");
    expect(editing).not.toContain("View version");
  });
  it("keeps Compare, Create and the optional primary edit action in that order", () => {
    const html = renderToStaticMarkup(createElement(PlanHeader, { code: "growth", name: "Growth", isPublic: true, beforeActions: createElement("button", {}, "Compare"), actions: createElement("button", {}, "Edit plan") }));
    expect(html.indexOf("Compare")).toBeLessThan(html.indexOf("Create plan from Growth"));
    expect(html.indexOf("Create plan from Growth")).toBeLessThan(html.indexOf("Edit plan"));
  });
  it("keeps the real primary Edit action in both reading modes and Compare out of Features", () => {
    for (const compare of [undefined, "scale.2"]) {
      const html = renderComparison({ compare });
      expect(html.indexOf('popoverTarget="compare-plan"')).toBeLessThan(html.indexOf("Create plan from Growth"));
      expect(html.indexOf("Create plan from Growth")).toBeLessThan(html.indexOf('id="edit-plan-action"'));
      const edit = html.slice(html.indexOf('id="edit-plan-action"'), html.indexOf('id="edit-plan-action"') + 500);
      expect(edit).toContain("bg-ink");
      const features = html.slice(html.indexOf('id="features"'), html.indexOf('id="compare-credit-heading"') > 0 ? html.indexOf('id="compare-credit-heading"') : html.indexOf('id="versions"'));
      expect(features).not.toContain('popoverTarget="compare-plan"');
    }
  });
  it("shows an explicit empty group after filtering and an icon/text trade-off for changed neutral values", () => {
    const base = { group: "capacity" as const, icon: null, leftLabel: "Growth v3", rightLabel: "Scale v2", currency: "USD", onlyDifferences: true };
    expect(renderToStaticMarkup(createElement(ComparisonFeatureTable, { ...base, rows: [] }))).toContain("No differences in capacity");
    const html = renderToStaticMarkup(createElement(ComparisonFeatureTable, { ...base, rows: [{ feature: { code: "seats", name: "Seats", type: "capacity", unit: "seat" }, value: { kind: "capacity", limit: { type: "limited", includedAmount: 10, overage: { type: "blocked" } } }, comparedValue: { kind: "capacity", limit: { type: "limited", includedAmount: 5, overage: { type: "billed", unitPrice: 100 } } }, differs: true, impact: "neutral" }] }));
    expect(html).toContain("Trade-off");
    expect(html).toContain("<svg");
    expect(html).toContain("then blocked");
    expect(html).toContain("$1 / seat");
  });
  it("retains comparison and filter parameters when links are scoped to a local company", () => {
    expect(scopeCatalogHref("/plans/growth?version=1&compare=scale.2&diff=1", "local-id")).toBe("/organizations/local-id/plans/growth?version=1&compare=scale.2&diff=1");
  });
});
