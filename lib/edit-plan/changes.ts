import type { BillingInterval, Catalog, ExhaustionPolicy, Plan } from "@/lib/catalog";
import type { DraftFlowAction, DraftFlowState, PendingField } from "@/lib/create-plan/draft-reducer";
import { draftFlowReducer, getPlacedMonthlyPrice } from "@/lib/create-plan/draft-reducer";
import { validateStep } from "@/lib/create-plan/steps";
import { getPeriodPricing, getPlanLadder, summarizeDraft } from "@/lib/derive/plans";
import { getDraftPosition, getFeatureComparisons } from "@/lib/derive/draft-flow";
import { checkDraftPlan } from "@/lib/derive/sanity-checks";
import { compareFeatureValues } from "@/lib/derive/compare-features";
import { compareExhaustionPolicies } from "@/lib/derive/exhaustion-policy";
import { diffFeatureSets, getCurrentRelease, resolveReleaseFeatures } from "@/lib/derive/releases";
import { getPlanSubscriptions } from "@/lib/derive/subscriptions";
import type { DraftPlan, FeatureChange, FeatureImpact, FeatureValue } from "@/lib/derive/types";

export type PlanChangeField = "name" | "visibility" | "monthly_price" | "monthly_credits" | "yearly_price" | "yearly_credits" | "exhaustion_policy" | "overage_price";
export type PlanChange = {
  field: PlanChangeField;
  before: string | number | boolean | ExhaustionPolicy;
  after: string | number | boolean | ExhaustionPolicy;
  impact: FeatureImpact | null;
  scope: "identity" | "renewal";
};
export type EditPlanAction = DraftFlowAction | { type: "discard"; state: DraftFlowState };

/** Editing copies the actual plan, retaining billing identities and existing pack associations. */
export function createEditState(catalog: Catalog, plan: Plan): DraftFlowState {
  return {
    draft: {
      code: plan.code, name: plan.name, isPublic: plan.isPublic, basePlanCode: plan.code,
      pricing: structuredClone(plan.pricing), exhaustionPolicy: structuredClone(plan.exhaustionPolicy),
      features: structuredClone(getCurrentRelease(plan)?.features ?? []),
      creditPackCodes: catalog.creditPacks.filter((pack) => pack.planCodes.includes(plan.code)).map((pack) => pack.code),
    },
    pending: [], codeEditedByHand: true, editedSinceBase: false, packsChosenByHand: true,
    lastOveragePrice: plan.exhaustionPolicy.type === "bill_overage" ? plan.exhaustionPolicy.pricePer1000Credits : null,
  };
}

/** Only values are editable: codes, billing structure, defaults, price IDs and packs stay intact. */
export function editPlanReducer(state: DraftFlowState, action: EditPlanAction): DraftFlowState {
  if (action.type === "discard") return action.state;
  if (["reset", "set_code", "apply_base", "set_pricing_type", "set_yearly_offered", "set_credit_packs", "use_suggested_packs"].includes(action.type)) return state;
  if (action.type === "set_price" || action.type === "set_included_credits") {
    const pricing = state.draft.pricing;
    if (pricing.type === "free") {
      return action.type === "set_included_credits" && action.interval === "monthly" ? draftFlowReducer(state, action) : state;
    }
    const candidates = pricing.prices.filter((price) => price.billingInterval === action.interval);
    const target = candidates.find((price) => price.isDefault) ?? candidates[0];
    if (!target) return state;
    const value = action.type === "set_price" ? action.price : action.credits;
    const property = action.type === "set_price" ? "price" : "includedCredits";
    const field = `${action.interval}_${action.type === "set_price" ? "price" : "credits"}` as const;
    const [first, ...rest] = pricing.prices.map((price) => price.id === target.id ? { ...price, [property]: value ?? 0 } : price);
    if (!first) return state;
    const pending = state.pending.filter((item) => item !== field);
    return { ...state, editedSinceBase: true, pending: value === null ? [...pending, field] : pending,
      draft: { ...state.draft, pricing: { type: "standard", prices: [first, ...rest] } } };
  }
  return draftFlowReducer(state, action);
}

function lowerIsBetter(before: number, after: number): FeatureImpact {
  return after < before ? "better" : after > before ? "worse" : "neutral";
}

/** One feature counts once; only renewal-scoped changes affect existing subscriptions. */
export function derivePlanChanges(catalog: Catalog, plan: Plan, draft: DraftPlan, pending: PendingField[] = []) {
  const planChanges: PlanChange[] = [];
  if (plan.name !== draft.name.trim()) planChanges.push({ field: "name", before: plan.name, after: draft.name.trim(), impact: null, scope: "identity" });
  if (plan.isPublic !== draft.isPublic) planChanges.push({ field: "visibility", before: plan.isPublic, after: draft.isPublic, impact: null, scope: "identity" });
  for (const interval of ["monthly", "yearly"] as BillingInterval[]) {
    const before = getPeriodPricing(plan.pricing, interval);
    const after = getPeriodPricing(draft.pricing, interval);
    if (!before || !after) continue;
    if (!pending.includes(`${interval}_price`) && before.price !== after.price) planChanges.push({ field: `${interval}_price`, before: before.price, after: after.price, impact: lowerIsBetter(before.price, after.price), scope: "renewal" });
    if (!pending.includes(`${interval}_credits`) && before.includedCredits !== after.includedCredits) planChanges.push({ field: `${interval}_credits`, before: before.includedCredits, after: after.includedCredits, impact: lowerIsBetter(after.includedCredits, before.includedCredits), scope: "renewal" });
  }
  const before = plan.exhaustionPolicy;
  const after = draft.exhaustionPolicy;
  const policyImpact = pending.includes("overage_price") ? null : compareExhaustionPolicies(before, after);
  if (policyImpact !== null && before.type !== after.type) {
    planChanges.push({ field: "exhaustion_policy", before, after, impact: policyImpact, scope: "renewal" });
  } else if (policyImpact !== null && before.type === "bill_overage" && after.type === "bill_overage") {
    planChanges.push({ field: "overage_price", before: before.pricePer1000Credits, after: after.pricePer1000Credits, impact: policyImpact, scope: "renewal" });
  }
  const featureChanges = diffFeatureSets(resolveReleaseFeatures(catalog.features, getCurrentRelease(plan)?.features ?? []), resolveReleaseFeatures(catalog.features, draft.features))
    .filter((change) => !pending.some((field) => field.startsWith(`feature:${change.feature.code}:`)));
  const renewalChanges = planChanges.filter((change) => change.scope === "renewal");
  const totalCustomers = getPlanSubscriptions(catalog, plan);
  return {
    planChanges, featureChanges, renewalChanges,
    changeCount: planChanges.length + featureChanges.length,
    createsVersion: featureChanges.length > 0,
    nextVersion: Math.max(...plan.releases.map((release) => release.version)) + 1,
    affectsAllCustomers: renewalChanges.length > 0,
    affectedCustomers: renewalChanges.length > 0 ? totalCustomers : 0,
    totalCustomers,
  };
}

export type PlanChanges = ReturnType<typeof derivePlanChanges>;

/** Capacity has two editable cells; each receives only its own change and impact. */
export function getCapacityCellChanges(change: FeatureChange | undefined) {
  if (!change) return { included: null, overage: null };
  const before = change.before.kind === "capacity" ? change.before.limit : null;
  const after = change.after.kind === "capacity" ? change.after.limit : null;
  const includedChanged = before?.type !== after?.type || (before?.type === "limited" && after?.type === "limited" && before.includedAmount !== after.includedAmount);
  const beforeOverage = before?.type === "limited" ? before.overage : null;
  const afterOverage = after?.type === "limited" ? after.overage : null;
  const overageChanged = beforeOverage?.type !== afterOverage?.type || (beforeOverage?.type === "billed" && afterOverage?.type === "billed" && beforeOverage.unitPrice !== afterOverage.unitPrice);
  const includedValue = (value: FeatureValue): FeatureValue => value.kind === "capacity" && value.limit.type === "limited"
    ? { kind: "capacity", limit: { ...value.limit, overage: { type: "blocked" } } } : value;
  const overageValue = (value: FeatureValue): FeatureValue => value.kind === "capacity" && value.limit.type === "limited"
    ? { kind: "capacity", limit: { ...value.limit, includedAmount: 0 } } : value;
  return {
    included: includedChanged ? { ...change, impact: compareFeatureValues(includedValue(change.before), includedValue(change.after)) } : null,
    overage: overageChanged ? { ...change, impact: compareFeatureValues(overageValue(change.before), overageValue(change.after)) } : null,
  };
}

export function validatePlanEdit(state: DraftFlowState) {
  // The code is immutable and belongs to this plan, so it is not a duplicate of another draft.
  return (["position", "price", "credits-run-out", "features"] as const).flatMap((step) => validateStep(step, state, []));
}

/** The original plan cannot be its own neighbour, same-price warning or duplicate-code error. */
export function deriveEditChecks(catalog: Catalog, original: Plan, state: DraftFlowState) {
  const summary = summarizeDraft(catalog, state.draft);
  const position = getDraftPosition(getPlanLadder(catalog), getPlacedMonthlyPrice(state), original.code);
  return {
    comparisons: getFeatureComparisons(summary.features, position),
    position,
    warnings: checkDraftPlan(state.draft, { ...catalog, plans: catalog.plans.filter((plan) => plan.code !== original.code) }),
  };
}
