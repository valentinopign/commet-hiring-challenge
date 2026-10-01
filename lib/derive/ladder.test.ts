import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { getCreditPackRows, summarizeCreditPacks } from "@/lib/derive/credit-packs";
import { getLadderRows, getPricePerCreditSavings } from "@/lib/derive/ladder";

const rows = getLadderRows(catalog);
const rowFor = (code: string) => rows.find((row) => row.plan.code === code);

describe("getLadderRows", () => {
  it("measures each step from the plan below", () => {
    expect(rows[0].step).toBeNull();
    expect(rowFor("growth")?.step).toEqual({
      fromPlanCode: "starter",
      fromPlanName: "Starter",
      priceDifference: 7000,
      creditsDifference: 9000,
      // $7.92 against $8.29 per 1,000 included credits.
      pricePerCreditSavings: 1 - 792 / (2900000 / 3500),
    });
  });

  it("gets cheaper per credit at every paid step", () => {
    expect(rowFor("growth")?.step?.pricePerCreditSavings).toBeCloseTo(0.044, 3);
    expect(rowFor("scale")?.step?.pricePerCreditSavings).toBeCloseTo(0.056, 3);
    expect(rowFor("enterprise")?.step?.pricePerCreditSavings).toBeCloseTo(0.109, 3);
  });

  it("does not compare credit prices against a free plan", () => {
    expect(rowFor("starter")?.step?.pricePerCreditSavings).toBeNull();
  });

  it("compares the cheapest available pack with the plan's overage", () => {
    const starter = rowFor("starter")?.packComparison;
    expect(starter?.cheapestPack.code).toBe("pack_10k");
    expect(starter?.savingsVersusOverage).toBeCloseTo(1 - 880 / 1200);

    const enterprise = rowFor("enterprise")?.packComparison;
    expect(enterprise?.cheapestPack.code).toBe("pack_250k");
    expect(enterprise?.savingsVersusOverage).toBeCloseTo(0.025);
  });

  it("has no pack comparison for a plan without packs", () => {
    expect(rowFor("free")?.packComparison).toBeNull();
  });
});

describe("summarizeCreditPacks", () => {
  it("computes the price per 1,000 credits of every pack", () => {
    expect(summarizeCreditPacks(catalog).map((pack) => pack.pricePerThousandCredits)).toEqual([880, 840, 780]);
  });
});

describe("getCreditPackRows", () => {
  const packRows = getCreditPackRows(catalog);

  it("compares a pack with every plan, in ladder order", () => {
    const smallest = packRows[0];
    expect(smallest.plans.map((plan) => `${plan.planCode}:${plan.isAvailable}`)).toEqual([
      "free:false",
      "starter:true",
      "growth:true",
      "scale:true",
      "enterprise:false",
    ]);
    expect(smallest.plans[1].savingsVersusOverage).toBeCloseTo(1 - 880 / 1200);
  });

  it("leaves savings empty where the pack is not available", () => {
    expect(packRows[0].plans[0].savingsVersusOverage).toBeNull();
  });
});

describe("getPricePerCreditSavings", () => {
  it("is negative when credits get dearer", () => {
    expect(getPricePerCreditSavings(800, 1000)).toBeCloseTo(-0.25);
  });

  it("is null when either plan has no credit price", () => {
    expect(getPricePerCreditSavings(null, 800)).toBeNull();
    expect(getPricePerCreditSavings(800, null)).toBeNull();
    expect(getPricePerCreditSavings(0, 800)).toBeNull();
  });
});
