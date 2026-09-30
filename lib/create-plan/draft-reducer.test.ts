import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import {
  createInitialState,
  draftFlowReducer,
  type DraftFlowAction,
  type DraftFlowState,
} from "@/lib/create-plan/draft-reducer";
import { draftBaseFromPlan } from "@/lib/derive/draft-flow";
import { getPlan } from "@/lib/derive/test-helpers";

const growth = draftBaseFromPlan(getPlan("growth", catalog));
const free = draftBaseFromPlan(getPlan("free", catalog));

function run(state: DraftFlowState, ...actions: DraftFlowAction[]): DraftFlowState {
  return actions.reduce(draftFlowReducer, state);
}

describe("createInitialState", () => {
  it("from scratch, asks for price, credits and the policy", () => {
    const state = createInitialState(null);
    expect(state.draft.basePlanCode).toBeNull();
    expect(state.draft.features).toEqual([]);
    expect(state.pending).toEqual(["monthly_price", "monthly_credits", "exhaustion_policy"]);
  });

  it("from a plan, has everything but the identity", () => {
    const state = createInitialState(growth);
    expect(state.draft.basePlanCode).toBe("growth");
    expect(state.draft.name).toBe("");
    expect(state.draft.code).toBe("");
    expect(state.pending).toEqual([]);
    expect(state.lastOveragePrice).toBe(1000);
  });
});

describe("name and code", () => {
  it("the code follows the name until it is edited by hand", () => {
    let state = run(createInitialState(null), { type: "set_name", name: "Growth Plus" });
    expect(state.draft.code).toBe("growth_plus");

    state = run(state, { type: "set_code", code: "gp" }, { type: "set_name", name: "Growth Max" });
    expect(state.draft.code).toBe("gp");
  });

  it("clearing the code hands it back to the name", () => {
    const state = run(
      createInitialState(null),
      { type: "set_code", code: "gp" },
      { type: "set_code", code: "" },
      { type: "set_name", name: "Team" },
    );
    expect(state.draft.code).toBe("team");
  });

  it("does not count as editing the base", () => {
    const state = run(createInitialState(growth), { type: "set_name", name: "Pro" }, { type: "set_visibility", isPublic: false });
    expect(state.editedSinceBase).toBe(false);
    expect(state.draft.isPublic).toBe(false);
  });
});

describe("apply_base", () => {
  it("replaces pricing, policy and features but keeps the identity", () => {
    const state = run(
      createInitialState(null),
      { type: "set_name", name: "Pro" },
      { type: "set_visibility", isPublic: false },
      { type: "apply_base", base: growth },
    );
    expect(state.draft.name).toBe("Pro");
    expect(state.draft.isPublic).toBe(false);
    expect(state.draft.features).toEqual(growth.features);
    expect(state.editedSinceBase).toBe(false);
  });

  it("going back to scratch empties what the base provided", () => {
    const state = run(createInitialState(growth), { type: "apply_base", base: null });
    expect(state.draft.features).toEqual([]);
    expect(state.pending).toContain("monthly_price");
  });
});

describe("pricing", () => {
  it("an emptied field is pending, not $0", () => {
    const state = run(createInitialState(growth), { type: "set_price", interval: "monthly", price: null });
    expect(state.pending).toEqual(["monthly_price"]);
    expect(state.editedSinceBase).toBe(true);

    const refilled = run(state, { type: "set_price", interval: "monthly", price: 4900 });
    expect(refilled.pending).toEqual([]);
  });

  it("switching to free keeps the monthly credits and drops the prices", () => {
    const state = run(createInitialState(growth), { type: "set_pricing_type", pricingType: "free" });
    expect(state.draft.pricing).toEqual({ type: "free", includedCredits: 12500 });
  });

  it("switching to paid asks for a monthly price", () => {
    const state = run(createInitialState(free), { type: "set_pricing_type", pricingType: "paid" });
    expect(state.draft.pricing.type).toBe("standard");
    expect(state.pending).toEqual(["monthly_price"]);
  });

  it("offering yearly billing asks for its own price and credits", () => {
    const state = run(
      createInitialState(null),
      { type: "set_yearly_offered", offered: true },
    );
    expect(state.pending).toEqual(expect.arrayContaining(["yearly_price", "yearly_credits"]));

    const withdrawn = run(state, { type: "set_yearly_offered", offered: false });
    expect(withdrawn.pending).not.toContain("yearly_price");
    expect(withdrawn.draft.pricing.type === "standard" && withdrawn.draft.pricing.prices).toHaveLength(1);
  });

  it("never derives one interval from the other", () => {
    const state = run(createInitialState(growth), { type: "set_price", interval: "monthly", price: 4900 });
    if (state.draft.pricing.type !== "standard") throw new Error("expected a paid draft");
    expect(state.draft.pricing.prices[1]?.price).toBe(99000);
  });
});

describe("exhaustion policy", () => {
  it("from scratch, choosing overage asks for its price", () => {
    const state = run(createInitialState(null), { type: "choose_exhaustion", policy: "bill_overage" });
    expect(state.pending).toEqual(["monthly_price", "monthly_credits", "overage_price"]);
  });

  it("remembers the overage price across a switch to block", () => {
    const state = run(
      createInitialState(growth),
      { type: "choose_exhaustion", policy: "block" },
      { type: "choose_exhaustion", policy: "bill_overage" },
    );
    expect(state.draft.exhaustionPolicy).toEqual({ type: "bill_overage", pricePer1000Credits: 1000 });
    expect(state.pending).toEqual([]);
  });
});

describe("features", () => {
  it("removing a feature leaves it out, which means not included", () => {
    const state = run(createInitialState(growth), { type: "set_feature", code: "sso", feature: null });
    expect(state.draft.features.some((feature) => feature.code === "sso")).toBe(false);
  });

  it("setting a feature replaces its previous value", () => {
    const state = run(createInitialState(growth), {
      type: "set_feature",
      code: "ai_generation",
      feature: { code: "ai_generation", type: "credit", creditsPerUnit: 4 },
    });
    const matching = state.draft.features.filter((feature) => feature.code === "ai_generation");
    expect(matching).toEqual([{ code: "ai_generation", type: "credit", creditsPerUnit: 4 }]);
  });
});
