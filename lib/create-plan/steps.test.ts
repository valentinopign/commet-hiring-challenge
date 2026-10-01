import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { createInitialState, draftFlowReducer, type DraftFlowState } from "@/lib/create-plan/draft-reducer";
import {
  CREATE_PLAN_STEPS,
  firstIncompleteStep,
  parseStepParam,
  resolveStep,
  validateStep,
  warningStep,
} from "@/lib/create-plan/steps";
import { draftBaseFromPlan } from "@/lib/derive/draft-flow";
import { checkDraftPlan } from "@/lib/derive/sanity-checks";
import { getPlan } from "@/lib/derive/test-helpers";

const existingPlans = catalog.plans.map(({ code, name }) => ({ code, name }));
const growth = draftBaseFromPlan(getPlan("growth"));

function named(state: DraftFlowState, name: string): DraftFlowState {
  return draftFlowReducer(state, { type: "set_name", name });
}

function fields(step: Parameters<typeof validateStep>[0], state: DraftFlowState): string[] {
  return validateStep(step, state, existingPlans).map((issue) => issue.field);
}

describe("validateStep: position", () => {
  it("reserves new for the creation route with a clear explanation", () => {
    expect(validateStep("position", named(createInitialState(null), "New"), [])).toEqual([
      { field: "plan-code", message: 'The code "new" is reserved for plan creation. Choose another code.' },
    ]);
  });
  it("asks for a name and a code", () => {
    expect(fields("position", createInitialState(null))).toEqual(["plan-name", "plan-code"]);
  });

  it("rejects a badly formed code and names the plan that owns a taken one", () => {
    const badCode = draftFlowReducer(named(createInitialState(null), "Pro"), { type: "set_code", code: "Pro Plan" });
    expect(fields("position", badCode)).toEqual(["plan-code"]);

    const taken = named(createInitialState(null), "Growth");
    expect(validateStep("position", taken, existingPlans)).toEqual([
      { field: "plan-code", message: "Growth already uses this code." },
    ]);
  });

  it("passes with a name and a free code", () => {
    expect(fields("position", named(createInitialState(null), "Growth Plus"))).toEqual([]);
  });
});

describe("validateStep: price", () => {
  it("from scratch, asks for the monthly price and credits", () => {
    expect(fields("price", createInitialState(null))).toEqual(["monthly-price", "monthly-credits"]);
  });

  it("a paid plan cannot cost $0", () => {
    const state = draftFlowReducer(createInitialState(growth), { type: "set_price", interval: "monthly", price: 0 });
    expect(validateStep("price", state, existingPlans)[0]?.message).toMatch(/choose Free/);
  });

  it("a free plan only needs its credits", () => {
    const state = draftFlowReducer(createInitialState(null), { type: "set_pricing_type", pricingType: "free" });
    expect(fields("price", state)).toEqual(["monthly-credits"]);
  });

  it("an offered yearly price needs its own values", () => {
    const state = draftFlowReducer(createInitialState(growth), { type: "set_price", interval: "yearly", price: null });
    expect(fields("price", state)).toEqual(["yearly-price"]);
  });
});

describe("validateStep: when credits run out", () => {
  it("asks for a choice, then for the overage price", () => {
    const scratch = createInitialState(null);
    expect(fields("credits-run-out", scratch)).toEqual(["exhaustion-policy"]);

    const overage = draftFlowReducer(scratch, { type: "choose_exhaustion", policy: "bill_overage" });
    expect(fields("credits-run-out", overage)).toEqual(["overage-price"]);

    const blocked = draftFlowReducer(scratch, { type: "choose_exhaustion", policy: "block" });
    expect(fields("credits-run-out", blocked)).toEqual([]);
  });
});

describe("step navigation", () => {
  it("from a base, only the position is missing", () => {
    expect(firstIncompleteStep(createInitialState(growth), existingPlans)).toBe("position");
    expect(firstIncompleteStep(named(createInitialState(growth), "Pro"), existingPlans)).toBe("review");
  });

  it("clamps a requested step to the furthest reachable one", () => {
    const state = named(createInitialState(null), "Pro");
    expect(resolveStep("features", state, existingPlans)).toBe("price");
    expect(resolveStep("position", state, existingPlans)).toBe("position");
    expect(resolveStep("nope", state, existingPlans)).toBe("position");
    expect(resolveStep(null, state, existingPlans)).toBe("position");
  });

  it("parses only known steps", () => {
    expect(parseStepParam("credits-run-out")).toBe("credits-run-out");
    expect(parseStepParam("Review")).toBeNull();
  });

  it("works without any existing plan", () => {
    const state = named(createInitialState(null), "Starter");
    expect(validateStep("position", state, [])).toEqual([]);
  });
});

describe("warningStep", () => {
  it("links every review warning to a step that exists", () => {
    const draft = {
      ...createInitialState(growth).draft,
      name: "Growth",
      code: "growth",
      exhaustionPolicy: { type: "block" as const },
    };
    const stepIds: string[] = CREATE_PLAN_STEPS.map((step) => step.id);
    const warnings = checkDraftPlan(draft, catalog);
    expect(warnings.length).toBeGreaterThan(0);
    for (const warning of warnings) expect(stepIds).toContain(warningStep(warning));
    expect(warningStep(warnings[0])).toBe("position");
  });
});

describe("validateStep: features", () => {
  it("nothing is required, but typed text must be a number", () => {
    expect(fields("features", createInitialState(null))).toEqual([]);
    const state = draftFlowReducer(createInitialState(growth), {
      type: "set_feature_input_invalid",
      code: "storage_gb",
      part: "unit_price",
      invalid: true,
    });
    expect(validateStep("features", state, existingPlans)).toEqual([
      { field: "feature-storage_gb-unit_price", message: "Enter an amount, like 0.50." },
    ]);
  });
});
