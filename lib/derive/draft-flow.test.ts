import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import type { Catalog } from "@/lib/catalog";
import {
  codeFromName,
  draftBaseFromPlan,
  getDraftBases,
  getDraftPosition,
  getYearlyReference,
  groupWarningsBySeverity,
  resolveBasePlanCode,
} from "@/lib/derive/draft-flow";
import { getPlanLadder } from "@/lib/derive/plans";
import { checkDraftPlan } from "@/lib/derive/sanity-checks";
import { cloneCatalog, getPlan, getRelease } from "@/lib/derive/test-helpers";

/** A company setting up its first plan: the flow has to work with nothing to compare against. */
function emptyCatalog(): Catalog {
  return { ...cloneCatalog(), plans: [], subscriptionsByRelease: [] };
}

describe("codeFromName", () => {
  it("turns a name into a snake_case code", () => {
    expect(codeFromName("Growth Plus")).toBe("growth_plus");
    expect(codeFromName("  Team  (annual)  ")).toBe("team_annual");
    expect(codeFromName("Básico")).toBe("basico");
  });

  it("drops what a code cannot start with", () => {
    expect(codeFromName("2024 Pro")).toBe("pro");
    expect(codeFromName("!!!")).toBe("");
  });
});

describe("draftBaseFromPlan", () => {
  it("copies pricing, policy and the current version's features", () => {
    const base = draftBaseFromPlan(getPlan("growth"));
    expect(base.currentReleaseVersion).toBe(3);
    expect(base.features).toEqual(getRelease("growth", 3).features);
    expect(base.exhaustionPolicy).toEqual({ type: "bill_overage", pricePer1000Credits: 1000 });
    expect(base.monthly?.price).toBe(9900);
  });

  it("gives the copied prices draft ids and keeps monthly as the default", () => {
    const base = draftBaseFromPlan(getPlan("growth"));
    if (base.pricing.type !== "standard") throw new Error("Growth is a paid plan");
    expect(base.pricing.prices.map((price) => [price.id, price.price, price.isDefault])).toEqual([
      ["draft_monthly", 9900, true],
      ["draft_yearly", 99000, false],
    ]);
  });

  it("does not share objects with the catalog", () => {
    const plan = getPlan("growth");
    const base = draftBaseFromPlan(plan);
    expect(base.features[0]).not.toBe(getRelease("growth", 3).features[0]);
    expect(base.exhaustionPolicy).not.toBe(plan.exhaustionPolicy);
  });

  it("keeps a free plan free", () => {
    expect(draftBaseFromPlan(getPlan("free")).pricing).toEqual({ type: "free", includedCredits: 500 });
  });
});

describe("getDraftBases", () => {
  it("lists every plan cheapest first", () => {
    expect(getDraftBases(catalog).map((base) => base.code)).toEqual(["free", "starter", "growth", "scale", "enterprise"]);
  });

  it("is empty without plans", () => {
    expect(getDraftBases(emptyCatalog())).toEqual([]);
  });
});

describe("resolveBasePlanCode", () => {
  const bases = getDraftBases(catalog);

  it("accepts an existing plan code", () => {
    expect(resolveBasePlanCode("growth", bases)).toBe("growth");
  });

  it("starts from scratch for anything else", () => {
    expect(resolveBasePlanCode(undefined, bases)).toBeNull();
    expect(resolveBasePlanCode("nope", bases)).toBeNull();
    expect(resolveBasePlanCode(["growth", "scale"], bases)).toBeNull();
  });
});

describe("getYearlyReference", () => {
  it("finds the ratio every paid plan shares", () => {
    expect(getYearlyReference(getPlanLadder(catalog))).toEqual({ priceMultiplier: 10, creditsMultiplier: 12 });
  });

  it("suggests nothing when plans disagree", () => {
    const source = cloneCatalog();
    const scale = getPlan("scale", source);
    if (scale.pricing.type !== "standard") throw new Error("Scale is a paid plan");
    scale.pricing.prices = [scale.pricing.prices[0], { ...scale.pricing.prices[1], price: 250000 }];
    expect(getYearlyReference(getPlanLadder(source))).toBeNull();
  });

  it("suggests nothing without paid plans", () => {
    expect(getYearlyReference(getPlanLadder(emptyCatalog()))).toBeNull();
  });
});

describe("getDraftPosition", () => {
  const ladder = getPlanLadder(catalog);

  it("places the draft between its neighbours", () => {
    const position = getDraftPosition(ladder, 4900);
    expect(position?.below?.code).toBe("starter");
    expect(position?.above?.code).toBe("growth");
  });

  it("has no place until there is a monthly price", () => {
    expect(getDraftPosition(ladder, null)).toBeNull();
  });

  it("has no neighbours on an empty ladder", () => {
    expect(getDraftPosition([], 4900)).toEqual({ below: null, above: null });
  });
});

describe("groupWarningsBySeverity", () => {
  it("splits the checks into the three review groups", () => {
    const warnings = checkDraftPlan(
      {
        name: "Growth",
        code: "growth",
        isPublic: true,
        basePlanCode: null,
        pricing: { type: "standard", prices: [{ id: "draft_monthly", billingInterval: "monthly", price: 9900, includedCredits: 0, isDefault: true }] },
        exhaustionPolicy: { type: "block" },
        features: [],
      },
      catalog,
    );
    const groups = groupWarningsBySeverity(warnings);
    expect(groups.blocking.map((warning) => warning.type)).toEqual(["code_taken"]);
    expect(groups.warning.map((warning) => warning.type)).toContain("same_price_as_existing_plan");
    expect(groups.info.map((warning) => warning.type)).toContain("blocked_without_credit_packs");
  });
});
