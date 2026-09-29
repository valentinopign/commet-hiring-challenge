import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { findNeighbourPlans, insertDraftIntoLadder } from "@/lib/derive/neighbours";
import { getPlanLadder, summarizeDraft } from "@/lib/derive/plans";
import { getRelease } from "@/lib/derive/test-helpers";

const ladder = getPlanLadder(catalog);

describe("getPlanLadder", () => {
  it("orders plans by monthly price, including the private one", () => {
    expect(ladder.map((plan) => plan.code)).toEqual(["free", "starter", "growth", "scale", "enterprise"]);
    expect(ladder.at(-1)?.isPublic).toBe(false);
  });
});

describe("findNeighbourPlans", () => {
  it("finds the plans around a price", () => {
    const { below, above } = findNeighbourPlans(ladder, 19900);
    expect([below?.code, above?.code]).toEqual(["growth", "scale"]);
  });

  it("returns null past either end of the ladder", () => {
    expect(findNeighbourPlans(ladder, 500000).above).toBeNull();
    expect(findNeighbourPlans(ladder, 0).below?.code).toBe("free");
    expect(findNeighbourPlans(ladder, 0).above?.code).toBe("starter");
  });

  it("counts a plan with the same price as below", () => {
    expect(findNeighbourPlans(ladder, 9900).below?.code).toBe("growth");
  });

  it("can leave a plan out", () => {
    expect(findNeighbourPlans(ladder, 9900, "growth").below?.code).toBe("starter");
  });
});

describe("insertDraftIntoLadder", () => {
  it("places the draft where its monthly price falls", () => {
    const draft = summarizeDraft(catalog, {
      name: "Pro",
      code: "pro",
      isPublic: true,
      basePlanCode: "growth",
      pricing: {
        type: "standard",
        prices: [{ id: "draft", billingInterval: "monthly", price: 19900, includedCredits: 26000, isDefault: true }],
      },
      exhaustionPolicy: { type: "block" },
      features: getRelease("growth", 3).features,
    });
    const entries = insertDraftIntoLadder(ladder, draft);
    expect(entries.map((entry) => (entry.isDraft ? entry.draft.code : entry.plan.code))).toEqual([
      "free",
      "starter",
      "growth",
      "pro",
      "scale",
      "enterprise",
    ]);
  });
});
