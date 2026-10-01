import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import type { Catalog } from "@/lib/catalog";
import { createEditState, editPlanReducer } from "./changes";
import { deriveEditPricingContext } from "./pricing-context";

function fixture(code = "growth") {
  const source: Catalog = structuredClone(catalog);
  const plan = source.plans.find((entry) => entry.code === code);
  if (!plan) throw new Error("Missing plan fixture");
  return { source, plan, state: createEditState(source, plan) };
}

describe("inline pricing context", () => {
  it("uses Growth's current neighbours and independent monthly/yearly credit costs", () => {
    const { source, plan, state } = fixture();
    const context = deriveEditPricingContext(source, plan, state);
    expect(context.periods[0]?.includedCreditCost).toBe(792);
    expect(context.periods[1]?.includedCreditCost).toBe(660);
    expect(context.periods[1]?.annualSaving).toBe(19800);
    expect(context.periods[0]?.neighbours.map((entry) => entry.code)).toEqual(["starter", "scale"]);
    expect(context.periods[1]?.neighbours.map((entry) => entry.pricing?.price)).toEqual([29000, 299000]);
  });
  it("updates neighbours when the draft moves and never includes its original plan", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(state, { type: "set_price", interval: "monthly", price: 35000 });
    const context = deriveEditPricingContext(source, plan, edited);
    expect(context.periods[0]?.neighbours.map((entry) => entry.code)).toEqual(["scale", "enterprise"]);
    expect(context.periods[0]?.neighbours.some((entry) => entry.code === "growth")).toBe(false);
  });
  it("uses the actual neighbours of another plan, including Free", () => {
    const { source, plan, state } = fixture("starter");
    expect(deriveEditPricingContext(source, plan, state).periods[0]?.neighbours.map((entry) => entry.code)).toEqual(["free", "growth"]);
    expect(deriveEditPricingContext(source, plan, state).periods[1]?.neighbours[0]?.pricing).toBeNull();
  });
  it("does not display placeholder-zero calculations while a price is incomplete", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(state, { type: "set_price", interval: "monthly", price: null });
    const context = deriveEditPricingContext(source, plan, edited);
    expect(context.comparisonReady).toBe(false);
    expect(context.periods[0]?.includedCreditCost).toBeNull();
    expect(context.periods[0]?.neighbours).toEqual([]);
    expect(context.periods[1]?.annualSaving).toBeNull();
  });
  it("handles empty credit allowances without claiming a unit cost", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(state, { type: "set_included_credits", interval: "monthly", credits: 0 });
    expect(deriveEditPricingContext(source, plan, edited).periods[0]?.includedCreditCost).toBeNull();
  });
  it("compares actual yearly pricing even when it is more expensive than monthly payments", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(state, { type: "set_price", interval: "yearly", price: 130000 });
    expect(deriveEditPricingContext(source, plan, edited).periods[1]?.annualSaving).toBe(-11200);
    expect(edited.draft.pricing).not.toEqual(state.draft.pricing);
    expect(plan.pricing).toEqual(state.draft.pricing);
  });
  it("supports a one-plan local company without invented neighbours or a yearly period", () => {
    const { source, plan, state } = fixture("free");
    source.organization.id = "org_local";
    source.plans = [plan];
    const context = deriveEditPricingContext(source, plan, state);
    expect(context.periods[0]?.neighbours).toEqual([]);
    expect(context.periods[0]?.includedCreditCost).toBe(0);
    expect(context.periods[1]?.period).toBeNull();
    expect(context.periods[1]?.annualSaving).toBeNull();
  });
});
