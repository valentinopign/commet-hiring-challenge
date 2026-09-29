import { describe, expect, it } from "vitest";
import type { ExhaustionPolicy, PlanPricing, ReleaseFeature } from "@/lib/catalog";
import { catalog } from "@/data/catalog";
import { checkDraftPlan } from "@/lib/derive/sanity-checks";
import { getRelease } from "@/lib/derive/test-helpers";
import type { DraftPlan } from "@/lib/derive/types";

function standardPricing(
  monthlyPrice: number,
  monthlyCredits: number,
  yearlyPrice = monthlyPrice * 10,
  yearlyCredits = monthlyCredits * 12,
): PlanPricing {
  return {
    type: "standard",
    prices: [
      { id: "draft_monthly", billingInterval: "monthly", price: monthlyPrice, includedCredits: monthlyCredits, isDefault: true },
      { id: "draft_yearly", billingInterval: "yearly", price: yearlyPrice, includedCredits: yearlyCredits, isDefault: false },
    ],
  };
}

function withFeature(features: ReleaseFeature[], replacement: ReleaseFeature): ReleaseFeature[] {
  return features.map((feature) => (feature.code === replacement.code ? replacement : feature));
}

/** Sits sensibly between Growth ($99, $7.92 / 1k) and Scale ($299, $7.48 / 1k). */
function makeDraft(overrides: Partial<DraftPlan> = {}): DraftPlan {
  const overage: ExhaustionPolicy = { type: "bill_overage", pricePer1000Credits: 950 };
  return {
    name: "Pro",
    code: "pro",
    isPublic: true,
    basePlanCode: "growth",
    pricing: standardPricing(19900, 26000),
    exhaustionPolicy: overage,
    features: getRelease("growth", 3).features,
    ...overrides,
  };
}

function warningTypes(draft: DraftPlan): string[] {
  return checkDraftPlan(draft, catalog).map((warning) => warning.type);
}

describe("checkDraftPlan", () => {
  it("accepts a draft that fits between its neighbours", () => {
    expect(checkDraftPlan(makeDraft(), catalog)).toEqual([]);
  });

  it("blocks a code that is already used or badly formed", () => {
    expect(checkDraftPlan(makeDraft({ code: "growth" }), catalog)[0]).toEqual({
      type: "code_taken",
      severity: "blocking",
      code: "growth",
    });
    expect(warningTypes(makeDraft({ code: "Pro Plan" }))).toContain("code_invalid");
    expect(warningTypes(makeDraft({ code: "" }))).toContain("code_invalid");
  });

  it("warns when credits cost more than on the cheaper neighbour", () => {
    const warnings = checkDraftPlan(makeDraft({ pricing: standardPricing(19900, 20000) }), catalog);
    expect(warnings).toContainEqual({
      type: "price_per_thousand_above_cheaper_plan",
      severity: "warning",
      planCode: "growth",
      draftValue: 995,
      neighbourValue: 792,
    });
  });

  it("warns when credits cost less than on the pricier neighbour", () => {
    const types = warningTypes(makeDraft({ pricing: standardPricing(19900, 30000) }));
    expect(types).toContain("price_per_thousand_below_pricier_plan");
  });

  it("does not compare credit price against the free plan", () => {
    const draft = makeDraft({
      pricing: standardPricing(1900, 1000),
      exhaustionPolicy: { type: "bill_overage", pricePer1000Credits: 2500 },
      features: getRelease("free", 1).features,
    });
    expect(warningTypes(draft)).not.toContain("price_per_thousand_above_cheaper_plan");
  });

  it("warns when a feature is worse than on the cheaper neighbour", () => {
    const features = withFeature(getRelease("growth", 3).features, {
      code: "ai_generation",
      type: "credit",
      creditsPerUnit: 7,
    });
    expect(checkDraftPlan(makeDraft({ features }), catalog)).toContainEqual({
      type: "feature_worse_than_cheaper_plan",
      severity: "warning",
      planCode: "growth",
      feature: catalog.features[0],
      neighbourValue: { kind: "credit", creditsPerUnit: 5 },
      draftValue: { kind: "credit", creditsPerUnit: 7 },
    });
  });

  it("treats a feature dropped from the draft as worse than the cheaper neighbour", () => {
    const features = getRelease("growth", 3).features.filter((feature) => feature.code !== "video_render");
    const worse = checkDraftPlan(makeDraft({ features }), catalog).filter(
      (warning) => warning.type === "feature_worse_than_cheaper_plan",
    );
    expect(worse).toHaveLength(1);
    expect(worse[0]).toMatchObject({ draftValue: { kind: "not_included" } });
  });

  it("informs when a feature beats the pricier neighbour", () => {
    const features = withFeature(getRelease("growth", 3).features, {
      code: "seats",
      type: "capacity",
      limit: { type: "unlimited" },
    });
    const better = checkDraftPlan(makeDraft({ features }), catalog).find(
      (warning) => warning.type === "feature_better_than_pricier_plan",
    );
    expect(better).toMatchObject({ severity: "info", planCode: "scale" });
  });

  it("warns about overage cheaper than included credits", () => {
    const types = warningTypes(
      makeDraft({ exhaustionPolicy: { type: "bill_overage", pricePer1000Credits: 500 } }),
    );
    expect(types).toContain("overage_cheaper_than_included");
  });

  it("informs when overage costs more than on the cheaper neighbour", () => {
    const types = warningTypes(
      makeDraft({ exhaustionPolicy: { type: "bill_overage", pricePer1000Credits: 1100 } }),
    );
    expect(types).toContain("overage_above_cheaper_plan");
  });

  it("checks the yearly price and credits against twelve months", () => {
    const types = warningTypes(makeDraft({ pricing: standardPricing(19900, 26000, 250000, 300000) }));
    expect(types).toContain("yearly_more_expensive_than_monthly");
    expect(types).toContain("yearly_fewer_credits_than_monthly");
  });

  it("warns about a price already used by another plan", () => {
    const types = warningTypes(makeDraft({ pricing: standardPricing(9900, 12500) }));
    expect(types).toContain("same_price_as_existing_plan");
  });

  it("flags a free plan that bills overage and a plan that blocks without packs", () => {
    expect(
      warningTypes(makeDraft({ pricing: { type: "free", includedCredits: 200 } })),
    ).toContain("free_plan_bills_overage");
    expect(warningTypes(makeDraft({ exhaustionPolicy: { type: "block" } }))).toContain(
      "blocked_without_credit_packs",
    );
  });

  it("orders blocking warnings before advice", () => {
    const warnings = checkDraftPlan(
      makeDraft({ code: "growth", exhaustionPolicy: { type: "block" } }),
      catalog,
    );
    expect(warnings.map((warning) => warning.severity)).toEqual(["blocking", "info"]);
  });
});
