import { describe, expect, it } from "vitest";
import { planEditHref } from "./navigation";
import { planComparisonHref } from "@/lib/derive/compare-plans";
import { scopeCatalogHref } from "@/lib/organization-routes";

describe("exclusive detail modes", () => {
  it.each(["/plans/growth", "/organizations/local-id/plans/growth"])("replaces comparison with current editing at %s", (path) => {
    const href = planEditHref(`https://demo.test${path}?version=1&compare=scale.2&diff=1&migrate=1#features`, 3, true);
    expect(href).toBe(`${path}?version=3&edit=1`);
    expect(planEditHref(`https://demo.test${path}?compare=growth.2`, 3, false)).toBe(`${path}?version=3&edit=instant`);
  });
  it("comparison links carry neither edits nor migration in either catalog", () => {
    const href = planComparisonHref("growth", { version: 3, compare: "scale.2", onlyDifferences: true });
    expect(href).toBe("/plans/growth?version=3&compare=scale.2&diff=1");
    expect(scopeCatalogHref(href, "local-id")).toBe("/organizations/local-id/plans/growth?version=3&compare=scale.2&diff=1");
  });
});
