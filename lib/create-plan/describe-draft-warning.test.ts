import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { describeDraftWarning } from "@/components/create-plan/describe-draft-warning";
import { checkDraftPlan } from "@/lib/derive/sanity-checks";
import { getPlanNames } from "@/lib/derive/plans";
import { getRelease } from "@/lib/derive/test-helpers";
import type { DraftPlan } from "@/lib/derive/types";

const zeroPriceDraft: DraftPlan = {
  name: "Trial", code: "trial", isPublic: true, basePlanCode: null,
  pricing: { type: "standard", prices: [{ id: "trial_monthly", billingInterval: "monthly", price: 0, includedCredits: 300, isDefault: true }] },
  exhaustionPolicy: { type: "block" }, features: [], creditPackCodes: [],
};

describe("draft warning copy", () => {
  it("says a neighbour at the same price costs the same, never that it costs less", () => {
    const details = checkDraftPlan(zeroPriceDraft, catalog)
      .filter((warning) => warning.type === "feature_worse_than_cheaper_plan")
      .map((warning) => describeDraftWarning(warning, getPlanNames(catalog), catalog.organization.currency).detail);
    expect(details.length).toBeGreaterThan(0);
    expect(details.every((detail) => detail.startsWith("Free costs the same"))).toBe(true);
    expect(details.some((detail) => detail.includes("costs less"))).toBe(false);
  });
  it("keeps 'costs less' for a cheaper neighbour", () => {
    const draft: DraftPlan = { ...zeroPriceDraft, pricing: { type: "standard", prices: [{ id: "trial_monthly", billingInterval: "monthly", price: 19900, includedCredits: 26000, isDefault: true }] }, features: getRelease("free", 1).features };
    const worse = checkDraftPlan(draft, catalog).find((warning) => warning.type === "feature_worse_than_cheaper_plan");
    if (!worse) throw new Error("Expected a worse feature against Growth");
    expect(describeDraftWarning(worse, getPlanNames(catalog), catalog.organization.currency).detail).toContain("costs less");
  });
});
