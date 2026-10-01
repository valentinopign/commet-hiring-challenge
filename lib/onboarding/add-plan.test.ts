import { describe, expect, it } from "vitest";
import type { Catalog } from "@/lib/catalog";
import type { DraftPlan } from "@/lib/derive/types";
import { getDraftBases } from "@/lib/derive/draft-flow";
import { getPlanLadder } from "@/lib/derive/plans";
import { addOnboardingPlan } from "./add-plan";

const empty: Catalog = {
  organization: { id: "new", name: "New company", currency: "USD", description: "" },
  features: [{ code: "image", name: "Generate an image", type: "credit", unit: "generation" }],
  plans: [], creditPacks: [], subscriptionsByRelease: [],
};
function draft(code: string): DraftPlan {
  return {
    code, name: code, isPublic: true, basePlanCode: null,
    pricing: { type: "standard", prices: [
      { id: "draft_monthly", billingInterval: "monthly", price: 3000, includedCredits: 12500, isDefault: true },
      { id: "draft_yearly", billingInterval: "yearly", price: 25000, includedCredits: 100000, isDefault: false },
    ] },
    exhaustionPolicy: { type: "block" },
    features: [{ code: "image", type: "credit", creditsPerUnit: 5 }],
    creditPackCodes: [],
  };
}
const date = "2026-09-30T00:00:00.000Z";

describe("addOnboardingPlan", () => {
  it("keeps multiple plans, features and independent yearly pricing without changing the original", () => {
    const first = addOnboardingPlan(empty, draft("starter"), date);
    const second = addOnboardingPlan(first, draft("growth"), date);
    expect(empty.plans).toHaveLength(0);
    expect(first.plans).toHaveLength(1);
    expect(second.plans.map((plan) => plan.code)).toEqual(["starter", "growth"]);
    expect(second.features).toEqual(empty.features);
    expect(second.subscriptionsByRelease).toEqual([]);
    expect(second.plans.map((plan) => plan.isDefault)).toEqual([true, false]);
    expect(getPlanLadder(second)[0].yearly?.price).toBe(25000);
    expect(getDraftBases(second)).toHaveLength(2);
    expect(second.plans[0].releases[0]).toMatchObject({ version: 1, status: "published", publishedAt: date });
  });
  it("snapshots the draft and avoids duplicate publication", () => {
    const input = draft("starter");
    const result = addOnboardingPlan(empty, input, date);
    input.features.length = 0;
    expect(result.plans[0].releases[0].features).toHaveLength(1);
    expect(addOnboardingPlan(result, draft("starter"), date)).toBe(result);
  });
  it("supports a free private plan with no features", () => {
    const input = { ...draft("free"), isPublic: false, features: [], pricing: { type: "free", includedCredits: 100 } } satisfies DraftPlan;
    const result = addOnboardingPlan(empty, input, date);
    expect(result.plans[0]).toMatchObject({ isPublic: false, pricing: input.pricing });
    expect(getPlanLadder(result)[0].monthly?.price).toBe(0);
  });
});
