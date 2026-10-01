import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import type { Catalog, Plan } from "@/lib/catalog";
import { createEditState, deriveEditChecks, derivePlanChanges, editPlanReducer, getCapacityCellChanges, validatePlanEdit } from "./changes";

function fixture(code = "growth") {
  const source: Catalog = structuredClone(catalog);
  const plan = source.plans.find((candidate) => candidate.code === code);
  if (!plan) throw new Error("Missing fixture plan");
  return { source, plan, state: createEditState(source, plan) };
}

describe("plan edit changes and scope", () => {
  it("excludes the edited plan from neighbours, duplicate-code and same-price checks", () => {
    const { source, plan, state } = fixture();
    const checks = deriveEditChecks(source, plan, state);
    expect(checks.position?.below?.code).toBe("starter");
    expect(checks.position?.above?.code).toBe("scale");
    expect(checks.warnings.some((warning) => warning.type === "code_taken" || warning.type === "same_price_as_existing_plan")).toBe(false);
    for (const comparison of Object.values(checks.comparisons)) {
      expect(comparison.below?.planCode).not.toBe("growth");
      expect(comparison.above?.planCode).not.toBe("growth");
    }
  });
  it("starts unchanged, valid and with its own packs and price identities", () => {
    const { source, plan, state } = fixture();
    expect(derivePlanChanges(source, plan, state.draft).changeCount).toBe(0);
    expect(validatePlanEdit(state)).toEqual([]);
    expect(state.draft.pricing).toEqual(plan.pricing);
    expect(state.draft.creditPackCodes).toEqual(["pack_10k", "pack_50k"]);
  });
  it("a feature-only edit creates v4 without moving any existing customers", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(state, { type: "set_feature", code: "ai_generation", feature: { code: "ai_generation", type: "credit", creditsPerUnit: 4 } });
    expect(derivePlanChanges(source, plan, edited.draft)).toMatchObject({ changeCount: 1, createsVersion: true, nextVersion: 4, affectsAllCustomers: false, affectedCustomers: 0, totalCustomers: 398 });
    expect(derivePlanChanges(source, plan, edited.draft).featureChanges[0]?.impact).toBe("better");
  });
  it("price and credits affect all 398 Growth customers, without creating a version", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(editPlanReducer(state, { type: "set_price", interval: "monthly", price: 10900 }), { type: "set_included_credits", interval: "yearly", credits: 1 });
    const changes = derivePlanChanges(source, plan, edited.draft);
    expect(changes).toMatchObject({ changeCount: 2, createsVersion: false, affectsAllCustomers: true, affectedCustomers: 398 });
    expect(changes.planChanges.map((change) => change.impact)).toEqual(["worse", "worse"]);
  });
  it("keeps both impact scopes when general fields and features change", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(editPlanReducer(state, { type: "set_price", interval: "monthly", price: 10000 }), { type: "set_feature", code: "sso", feature: null });
    expect(derivePlanChanges(source, plan, edited.draft)).toMatchObject({ createsVersion: true, affectsAllCustomers: true, affectedCustomers: 398, changeCount: 2 });
  });
  it("counts multiple capacity edits once and preserves a trade-off", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(state, { type: "set_feature", code: "storage_gb", feature: { code: "storage_gb", type: "capacity", limit: { type: "limited", includedAmount: 300, overage: { type: "blocked" } } } });
    const changes = derivePlanChanges(source, plan, edited.draft);
    expect(changes.changeCount).toBe(1);
    expect(changes.featureChanges[0]?.impact).toBe("neutral");
  });
  it("unavailable false and absent booleans are equivalent, independent of feature order", () => {
    const { source, plan, state } = fixture();
    state.draft.features = state.draft.features.filter((feature) => !(feature.type === "boolean" && !feature.enabled)).reverse();
    expect(derivePlanChanges(source, plan, state.draft).changeCount).toBe(0);
  });
  it("reverting values removes effective changes, even if the draft was edited", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(state, { type: "set_price", interval: "monthly", price: 10900 });
    const reverted = editPlanReducer(edited, { type: "set_price", interval: "monthly", price: 9900 });
    expect(reverted.editedSinceBase).toBe(true);
    expect(derivePlanChanges(source, plan, reverted.draft).changeCount).toBe(0);
  });
  it("identity changes preserve code and do not claim a billing or feature effect", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(editPlanReducer(state, { type: "set_name", name: "Growth Plus" }), { type: "set_visibility", isPublic: false });
    expect(edited.draft.code).toBe("growth");
    expect(derivePlanChanges(source, plan, edited.draft)).toMatchObject({ changeCount: 2, createsVersion: false, affectsAllCustomers: false });
  });
  it("policy switches count once as a trade-off; overage reductions are better", () => {
    const { source, plan, state } = fixture();
    const blocked = editPlanReducer(state, { type: "choose_exhaustion", policy: "block" });
    expect(derivePlanChanges(source, plan, blocked.draft).planChanges).toMatchObject([{ field: "exhaustion_policy", impact: "neutral" }]);
    const cheaper = editPlanReducer(state, { type: "set_overage_price", price: 100 });
    expect(derivePlanChanges(source, plan, cheaper.draft).planChanges).toMatchObject([{ field: "overage_price", impact: "better" }]);
  });
  it("works for Free, zero-customer local catalogs and one-version plans", () => {
    const { source, plan, state } = fixture("free");
    source.organization = { ...source.organization, id: "org_local" };
    source.subscriptionsByRelease = [];
    const edited = editPlanReducer(state, { type: "set_included_credits", interval: "monthly", credits: 600 });
    expect(derivePlanChanges(source, plan, edited.draft)).toMatchObject({ changeCount: 1, affectedCustomers: 0, totalCustomers: 0, affectsAllCustomers: true, nextVersion: 2 });
  });
  it("excludes orphan subscriptions and uses a version number beyond every existing release", () => {
    const { source, plan, state } = fixture();
    source.subscriptionsByRelease.push({ planCode: "growth", version: 99, subscriptions: 900 });
    plan.releases.push({ version: 8, status: "building", publishedAt: "", features: [] });
    expect(derivePlanChanges(source, plan, state.draft)).toMatchObject({ totalCustomers: 398, nextVersion: 9 });
  });
  it("locks billing type, offered periods, code, pack assignments and base replacement", () => {
    const { state } = fixture();
    for (const action of [{ type: "set_code", code: "changed" }, { type: "set_pricing_type", pricingType: "free" }, { type: "set_yearly_offered", offered: false }, { type: "apply_base", base: null }] as const) {
      expect(editPlanReducer(state, action)).toBe(state);
    }
    expect(editPlanReducer(state, { type: "set_credit_packs", codes: [] })).toBe(state);
  });
  it("preserves all price IDs, defaults and other entries when editing one interval", () => {
    const { source, plan } = fixture();
    if (plan.pricing.type !== "standard") throw new Error("Expected paid plan");
    plan.pricing.prices.push({ id: "extra", billingInterval: "monthly", price: 100, includedCredits: 1, isDefault: false });
    const before = structuredClone(plan);
    const edited = editPlanReducer(createEditState(source, plan), { type: "set_price", interval: "monthly", price: 10900 });
    if (edited.draft.pricing.type !== "standard") throw new Error("Expected paid draft");
    expect(edited.draft.pricing.prices.map(({ id, isDefault }) => ({ id, isDefault }))).toEqual(plan.pricing.prices.map(({ id, isDefault }) => ({ id, isDefault })));
    expect(edited.draft.pricing.prices.at(-1)?.price).toBe(100);
    expect(plan).toEqual(before);
  });
  it("validates unfinished numeric edits and rejects empty names", () => {
    const { state } = fixture();
    const edited = editPlanReducer(editPlanReducer(state, { type: "set_price", interval: "monthly", price: null }), { type: "set_name", name: " " });
    expect(validatePlanEdit(edited).map((issue) => issue.field)).toEqual(["plan-name", "monthly-price"]);
  });
  it("does not report an unfinished price as an intentional zero", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(state, { type: "set_price", interval: "monthly", price: null });
    expect(derivePlanChanges(source, plan, edited.draft, edited.pending).changeCount).toBe(0);
    expect(validatePlanEdit(edited)).toHaveLength(1);
  });
  it("does not change the source plan or catalog when features are edited", () => {
    const { source, plan, state } = fixture();
    const before: Plan = structuredClone(plan);
    const edited = editPlanReducer(state, { type: "set_feature", code: "api_calls", feature: null });
    derivePlanChanges(source, plan, edited.draft);
    expect(plan).toEqual(before);
  });
  it("discard restores original values and pending input state", () => {
    const { source, plan, state } = fixture();
    const edited = editPlanReducer(state, { type: "set_price", interval: "monthly", price: null });
    const discarded = editPlanReducer(edited, { type: "discard", state: createEditState(source, plan) });
    expect(discarded).toEqual(state);
  });
  it("marks only the changed capacity cell and shows independent opposing impacts", () => {
    const { source, plan, state } = fixture();
    const increased = editPlanReducer(state, { type: "set_feature", code: "storage_gb", feature: { code: "storage_gb", type: "capacity", limit: { type: "limited", includedAmount: 300, overage: { type: "billed", unitPrice: 12 } } } });
    const first = getCapacityCellChanges(derivePlanChanges(source, plan, increased.draft).featureChanges[0]);
    expect(first.included?.impact).toBe("better");
    expect(first.overage).toBeNull();
    const blocked = editPlanReducer(increased, { type: "set_feature", code: "storage_gb", feature: { code: "storage_gb", type: "capacity", limit: { type: "limited", includedAmount: 300, overage: { type: "blocked" } } } });
    const second = getCapacityCellChanges(derivePlanChanges(source, plan, blocked.draft).featureChanges[0]);
    expect(second.included?.impact).toBe("better");
    expect(second.overage?.impact).toBe("worse");
  });
});
