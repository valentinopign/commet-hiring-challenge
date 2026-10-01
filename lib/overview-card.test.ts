import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { catalog } from "@/data/catalog";
import { getLadderRows } from "@/lib/derive/ladder";
import { PlanCard } from "@/components/plans/plan-card";
import { VersionSplitBar } from "@/components/plans/version-split-bar";
import { PlanMonthlyPrice } from "@/components/plans/plan-monthly-price";

vi.mock("@/components/organizations/catalog-link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => createElement("a", props, children),
}));

function markup(code: string) {
  const row = getLadderRows(catalog).find((entry) => entry.plan.code === code);
  if (!row) throw new Error(`Missing fixture: ${code}`);
  return renderToStaticMarkup(createElement(PlanCard, { row, alerts: [], currency: "USD" }));
}

describe("compact overview cards", () => {
  it("shows the price, credits and per-credit comparison", () => {
    const html = markup("growth");
    expect(html).toContain("4% less per credit");
    expect(html).toContain("vs Starter");
    expect(html).toContain("$99");
    expect(html).toContain("12,500");
  });
  it("keeps compact overage, visible version percentages and a complete accessible summary", () => {
    const html = markup("starter");
    expect(html).toContain("Overage $12");
    expect(html).toContain('title="1,000 credits"');
    expect(html).toContain('class="sr-only">Customers by version:');
    expect(html).toContain("current, 502 customers (85%)");
    expect(html).toContain("bg-retired-stripes");
    expect(html).toContain("v1 15%");
    expect(html).toContain("v2 85%");
  });
  it("shows service-stop policy and the single-version distribution", () => {
    const html = markup("free");
    expect(html).toContain("Service stops");
    expect(html).toContain("1,240");
    expect(html).toContain("v1 100%");
  });
  it("does not fabricate a distribution for a new plan without customers", () => {
    const html = renderToStaticMarkup(createElement(VersionSplitBar, { versions: [] }));
    expect(html).toContain('class="sr-only">No customers');
    expect(html).toContain("bg-line");
    expect(html).not.toContain("bg-live");
  });
  it("keeps the explicit missing monthly price state", () => {
    expect(renderToStaticMarkup(createElement(PlanMonthlyPrice, { monthly: null, step: null, currency: "USD" }))).toContain("No monthly price");
  });
});
