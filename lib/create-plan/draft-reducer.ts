import type { BillingInterval, ExhaustionPolicy, PlanPrice, PlanPricing, ReleaseFeature } from "@/lib/catalog";
import { codeFromName } from "@/lib/derive/draft-flow";
import type { DraftBase, DraftPlan } from "@/lib/derive/types";

/**
 * Required values the person has not given yet. The draft holds a placeholder (0, or "block")
 * meanwhile so it always has the `DraftPlan` shape; this list is what says the value is missing,
 * so "not set yet" is never confused with a real $0.
 */
export type PendingField =
  | "monthly_price"
  | "monthly_credits"
  | "yearly_price"
  | "yearly_credits"
  | "exhaustion_policy"
  | "overage_price"
  | FeaturePendingField;

/** The number inputs of a feature row; each can hold text that is not a valid number yet. */
export type FeatureInputPart = "credits" | "amount" | "unit_price";
export type FeaturePendingField = `feature:${string}:${FeatureInputPart}`;

export function featurePendingField(code: string, part: FeatureInputPart): FeaturePendingField {
  return `feature:${code}:${part}`;
}

/** The number inputs a feature value has, so pending text in an input that is gone is dropped. */
function featureInputParts(feature: ReleaseFeature | null): FeatureInputPart[] {
  if (!feature || feature.type === "boolean") return [];
  if (feature.type === "credit") return ["credits"];
  if (feature.limit.type === "unlimited") return [];
  return feature.limit.overage.type === "billed" ? ["amount", "unit_price"] : ["amount"];
}

export type DraftFlowState = {
  draft: DraftPlan;
  /** Until the person edits the code, it follows the name. */
  codeEditedByHand: boolean;
  pending: PendingField[];
  /** Price, credits, policy or features changed after the base was applied. */
  editedSinceBase: boolean;
  /** Restored when the person switches from "block" back to overage. */
  lastOveragePrice: number | null;
};

export type DraftFlowAction =
  | { type: "set_name"; name: string }
  | { type: "set_code"; code: string }
  | { type: "set_visibility"; isPublic: boolean }
  | { type: "apply_base"; base: DraftBase | null }
  | { type: "set_pricing_type"; pricingType: "free" | "paid" }
  | { type: "set_price"; interval: BillingInterval; price: number | null }
  | { type: "set_included_credits"; interval: BillingInterval; credits: number | null }
  | { type: "set_yearly_offered"; offered: boolean }
  | { type: "choose_exhaustion"; policy: ExhaustionPolicy["type"] }
  | { type: "set_overage_price"; price: number | null }
  | { type: "set_feature"; code: string; feature: ReleaseFeature | null }
  | { type: "set_feature_input_invalid"; code: string; part: FeatureInputPart; invalid: boolean };

const SCRATCH_PENDING: PendingField[] = ["monthly_price", "monthly_credits", "exhaustion_policy"];

function priceEntry(interval: BillingInterval, price: number, includedCredits: number): PlanPrice {
  return { id: `draft_${interval}`, billingInterval: interval, price, includedCredits, isDefault: interval === "monthly" };
}

function scratchPricing(): PlanPricing {
  return { type: "standard", prices: [priceEntry("monthly", 0, 0)] };
}

function withPending(pending: PendingField[], field: PendingField, isPending: boolean): PendingField[] {
  const without = pending.filter((candidate) => candidate !== field);
  return isPending ? [...without, field] : without;
}

function findPrice(pricing: PlanPricing, interval: BillingInterval): PlanPrice | undefined {
  return pricing.type === "standard" ? pricing.prices.find((price) => price.billingInterval === interval) : undefined;
}

/** Monthly first, then yearly, so the default price always leads the tuple. */
function standardPricing(monthly: PlanPrice, yearly: PlanPrice | undefined): PlanPricing {
  return { type: "standard", prices: yearly ? [monthly, yearly] : [monthly] };
}

function updatePrice(
  pricing: PlanPricing,
  interval: BillingInterval,
  change: Partial<Pick<PlanPrice, "price" | "includedCredits">>,
): PlanPricing {
  if (pricing.type === "free") {
    if (interval === "yearly" || change.includedCredits === undefined) return pricing;
    return { type: "free", includedCredits: change.includedCredits };
  }
  const monthly = findPrice(pricing, "monthly") ?? priceEntry("monthly", 0, 0);
  const yearly = findPrice(pricing, "yearly");
  if (interval === "monthly") return standardPricing({ ...monthly, ...change }, yearly);
  return standardPricing(monthly, yearly ? { ...yearly, ...change } : undefined);
}

/**
 * The monthly price that places the draft on the ladder: 0 for a free plan, `null` while a paid
 * plan has no price yet (placing it at $0 would put it next to the free plan).
 */
export function getPlacedMonthlyPrice(state: DraftFlowState): number | null {
  const { pricing } = state.draft;
  if (pricing.type === "free") return 0;
  if (state.pending.includes("monthly_price")) return null;
  return findPrice(pricing, "monthly")?.price ?? null;
}

export function createInitialState(base: DraftBase | null): DraftFlowState {
  const empty: DraftFlowState = {
    draft: {
      name: "",
      code: "",
      isPublic: true,
      basePlanCode: null,
      pricing: scratchPricing(),
      exhaustionPolicy: { type: "block" },
      features: [],
    },
    codeEditedByHand: false,
    pending: SCRATCH_PENDING,
    editedSinceBase: false,
    lastOveragePrice: null,
  };
  return draftFlowReducer(empty, { type: "apply_base", base });
}

/** Every value in cents or credits arrives already parsed; the inputs own the text. */
export function draftFlowReducer(state: DraftFlowState, action: DraftFlowAction): DraftFlowState {
  const { draft } = state;
  // Anything past the position step counts as editing what the base provided.
  const edited = (next: Partial<DraftFlowState>): DraftFlowState => ({ ...state, ...next, editedSinceBase: true });

  switch (action.type) {
    case "set_name":
      return {
        ...state,
        draft: {
          ...draft,
          name: action.name,
          code: state.codeEditedByHand ? draft.code : codeFromName(action.name),
        },
      };

    case "set_code":
      // Clearing the code hands it back to the name, which is what an empty field suggests.
      return { ...state, draft: { ...draft, code: action.code }, codeEditedByHand: action.code !== "" };

    case "set_visibility":
      return { ...state, draft: { ...draft, isPublic: action.isPublic } };

    case "apply_base": {
      const { base } = action;
      if (!base) {
        return {
          ...state,
          draft: { ...draft, basePlanCode: null, pricing: scratchPricing(), exhaustionPolicy: { type: "block" }, features: [] },
          pending: SCRATCH_PENDING,
          editedSinceBase: false,
          lastOveragePrice: null,
        };
      }
      return {
        ...state,
        draft: {
          ...draft,
          basePlanCode: base.code,
          pricing: structuredClone(base.pricing),
          exhaustionPolicy: { ...base.exhaustionPolicy },
          features: structuredClone(base.features),
        },
        pending: [],
        editedSinceBase: false,
        lastOveragePrice: base.exhaustionPolicy.type === "bill_overage" ? base.exhaustionPolicy.pricePer1000Credits : null,
      };
    }

    case "set_pricing_type": {
      if ((action.pricingType === "free") === (draft.pricing.type === "free")) return state;
      // The monthly credits carry over both ways: they are the one value free and paid share.
      const monthlyCredits = draft.pricing.type === "free"
        ? draft.pricing.includedCredits
        : (findPrice(draft.pricing, "monthly")?.includedCredits ?? 0);
      if (action.pricingType === "free") {
        return edited({
          draft: { ...draft, pricing: { type: "free", includedCredits: monthlyCredits } },
          pending: state.pending.filter((field) => field !== "monthly_price" && field !== "yearly_price" && field !== "yearly_credits"),
        });
      }
      return edited({
        draft: { ...draft, pricing: standardPricing(priceEntry("monthly", 0, monthlyCredits), undefined) },
        pending: withPending(state.pending, "monthly_price", true),
      });
    }

    case "set_price": {
      if (draft.pricing.type === "free") return state;
      const field: PendingField = action.interval === "monthly" ? "monthly_price" : "yearly_price";
      return edited({
        draft: { ...draft, pricing: updatePrice(draft.pricing, action.interval, { price: action.price ?? 0 }) },
        pending: withPending(state.pending, field, action.price === null),
      });
    }

    case "set_included_credits": {
      const field: PendingField = action.interval === "monthly" ? "monthly_credits" : "yearly_credits";
      return edited({
        draft: { ...draft, pricing: updatePrice(draft.pricing, action.interval, { includedCredits: action.credits ?? 0 }) },
        pending: withPending(state.pending, field, action.credits === null),
      });
    }

    case "set_yearly_offered": {
      if (draft.pricing.type === "free") return state;
      const monthly = findPrice(draft.pricing, "monthly") ?? priceEntry("monthly", 0, 0);
      const yearly = findPrice(draft.pricing, "yearly");
      if (action.offered === Boolean(yearly)) return state;
      const pending = withPending(
        withPending(state.pending, "yearly_price", action.offered),
        "yearly_credits",
        action.offered,
      );
      return edited({
        draft: { ...draft, pricing: standardPricing(monthly, action.offered ? priceEntry("yearly", 0, 0) : undefined) },
        pending,
      });
    }

    case "choose_exhaustion": {
      const withoutChoice = withPending(state.pending, "exhaustion_policy", false);
      if (action.policy === "block") {
        return edited({
          draft: { ...draft, exhaustionPolicy: { type: "block" } },
          pending: withPending(withoutChoice, "overage_price", false),
        });
      }
      if (draft.exhaustionPolicy.type === "bill_overage" && !state.pending.includes("exhaustion_policy")) return state;
      const remembered = state.lastOveragePrice;
      return edited({
        draft: { ...draft, exhaustionPolicy: { type: "bill_overage", pricePer1000Credits: remembered ?? 0 } },
        pending: withPending(withoutChoice, "overage_price", remembered === null),
      });
    }

    case "set_overage_price":
      if (draft.exhaustionPolicy.type !== "bill_overage") return state;
      return edited({
        draft: { ...draft, exhaustionPolicy: { type: "bill_overage", pricePer1000Credits: action.price ?? 0 } },
        pending: withPending(state.pending, "overage_price", action.price === null),
        lastOveragePrice: action.price,
      });

    case "set_feature": {
      const others = draft.features.filter((feature) => feature.code !== action.code);
      // Absent means "not included", the same rule the catalog's releases follow.
      const features = action.feature ? [...others, action.feature] : others;
      const keptParts = featureInputParts(action.feature).map((part) => featurePendingField(action.code, part));
      const pending = state.pending.filter(
        (field) => !field.startsWith(`feature:${action.code}:`) || keptParts.includes(field as FeaturePendingField),
      );
      return edited({ draft: { ...draft, features }, pending });
    }

    case "set_feature_input_invalid":
      return {
        ...state,
        pending: withPending(state.pending, featurePendingField(action.code, action.part), action.invalid),
      };
  }
}
