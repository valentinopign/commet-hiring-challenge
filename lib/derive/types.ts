import type {
  BillingInterval,
  CapacityLimit,
  CatalogFeature,
  ExhaustionPolicy,
  PlanPricing,
  ReleaseFeature,
  ReleaseStatus,
} from "@/lib/catalog";

/** One billing interval of a plan, normalised so free and paid plans share a shape. Money in cents. */
export type PeriodPricing = {
  interval: BillingInterval;
  price: number;
  includedCredits: number;
  /** Fractional cents are kept on purpose; rounding happens only when formatting. */
  pricePerThousandCredits: number | null;
};

/**
 * A feature as a customer experiences it in one release. `not_included` exists because
 * a feature absent from a release is unavailable, and the UI must say so explicitly.
 */
export type FeatureValue =
  | { kind: "credit"; creditsPerUnit: number }
  | { kind: "capacity"; limit: CapacityLimit }
  | { kind: "boolean"; enabled: boolean }
  | { kind: "not_included" };

export type ResolvedFeature = {
  feature: CatalogFeature;
  value: FeatureValue;
};

/** Always from the customer's point of view. */
export type FeatureImpact = "better" | "worse" | "neutral";

export type FeatureChangeKind = "added" | "removed" | "changed";

export type FeatureChange = {
  feature: CatalogFeature;
  kind: FeatureChangeKind;
  before: FeatureValue;
  after: FeatureValue;
  impact: FeatureImpact;
};

export type VersionShare = {
  version: number;
  status: ReleaseStatus;
  subscriptions: number;
  /** Ratio between 0 and 1. */
  share: number;
  /** Whole percentage, rounded so that a plan's versions always add up to 100. */
  percent: number;
  isCurrent: boolean;
};

export type TimelineEntry = VersionShare & {
  publishedAt: string;
  /** When the next version was published. Releases carry no retirement date of their own. */
  replacedAt: string | null;
  features: ResolvedFeature[];
  /** `null` for the first version: there is nothing to compare it with. */
  changesFromPrevious: FeatureChange[] | null;
};

export type PlanSummary = {
  code: string;
  name: string;
  description: string;
  isPublic: boolean;
  isDefault: boolean;
  /** `null` only when a paid plan has no monthly price; such plans sort last on the ladder. */
  monthly: PeriodPricing | null;
  yearly: PeriodPricing | null;
  exhaustionPolicy: ExhaustionPolicy;
  currentReleaseVersion: number;
  currentFeatures: ResolvedFeature[];
  totalSubscriptions: number;
  versionSplit: VersionShare[];
};

export type CatalogTotals = {
  totalCustomers: number;
  customersOnRetiredVersions: number;
  /** Customers on any plan that is not free, Enterprise included. */
  paidCustomers: number;
};

/** One plan's slice of the customer base, for the distribution bar on the overview. */
export type CustomerSegment = {
  planCode: string;
  planName: string;
  customers: number;
  share: number;
  /** Whole percentage; the segments of a distribution always add up to 100. */
  percent: number;
  isPaid: boolean;
  /** Position among paid plans, cheapest first (0-based); `null` for a free plan. */
  paidRank: number | null;
};

export type CustomerDistribution = {
  totalCustomers: number;
  /** Ladder order, cheapest first. */
  segments: CustomerSegment[];
  paidPlanCount: number;
  /** The plan with the most customers; `null` when nobody is subscribed yet. */
  largest: CustomerSegment | null;
};

export type NeighbourPlans = {
  below: PlanSummary | null;
  above: PlanSummary | null;
};

/** The plan being created. Reuses the catalog types so a draft could become a real plan. */
export type DraftPlan = {
  name: string;
  code: string;
  isPublic: boolean;
  basePlanCode: string | null;
  pricing: PlanPricing;
  exhaustionPolicy: ExhaustionPolicy;
  features: ReleaseFeature[];
  /**
   * Credit packs the plan would be sold with. Packs list their plans (`planCodes`), so publishing
   * would add this plan's code to each of them.
   */
  creditPackCodes: string[];
};

export type DraftSummary = {
  code: string;
  name: string;
  isPublic: boolean;
  monthly: PeriodPricing | null;
  yearly: PeriodPricing | null;
  exhaustionPolicy: ExhaustionPolicy;
  features: ResolvedFeature[];
};

export type LadderEntry =
  | { isDraft: false; plan: PlanSummary }
  | { isDraft: true; draft: DraftSummary };

export type Severity = "critical" | "warning" | "info";

/** Data only: the component that renders an alert owns its wording. */
export type CatalogAlert =
  | {
      type: "majority_on_retired";
      severity: Severity;
      planCode: string;
      retiredSubscriptions: number;
      totalSubscriptions: number;
      retiredShare: number;
      currentReleaseVersion: number;
    }
  | {
      type: "release_without_customers";
      severity: Severity;
      planCode: string;
      version: number;
      status: ReleaseStatus;
    }
  | {
      type: "orphan_subscriptions";
      severity: Severity;
      planCode: string;
      version: number;
      subscriptions: number;
    }
  | {
      type: "current_version_mismatch";
      severity: Severity;
      planCode: string;
      currentReleaseVersion: number;
      publishedVersions: number[];
    }
  | {
      type: "blocked_without_credit_packs";
      severity: Severity;
      planCode: string;
    };

/** `blocking` prevents publishing; the others are advice the person can override. */
export type DraftWarningSeverity = "blocking" | "warning" | "info";

export type DraftWarning =
  | { type: "code_taken"; severity: DraftWarningSeverity; code: string }
  | { type: "code_invalid"; severity: DraftWarningSeverity; code: string }
  | {
      type: "same_price_as_existing_plan";
      severity: DraftWarningSeverity;
      planCode: string;
      price: number;
    }
  | { type: "no_included_credits"; severity: DraftWarningSeverity }
  | {
      type: "price_per_thousand_above_cheaper_plan";
      severity: DraftWarningSeverity;
      planCode: string;
      draftValue: number;
      neighbourValue: number;
      /** The cheaper neighbour can share the draft's monthly price, so it does not always cost less. */
      neighbourCostsSame: boolean;
    }
  | {
      type: "price_per_thousand_below_pricier_plan";
      severity: DraftWarningSeverity;
      planCode: string;
      draftValue: number;
      neighbourValue: number;
    }
  | {
      type: "overage_cheaper_than_included";
      severity: DraftWarningSeverity;
      overagePricePerThousand: number;
      includedPricePerThousand: number;
    }
  | {
      type: "overage_above_cheaper_plan";
      severity: DraftWarningSeverity;
      planCode: string;
      draftValue: number;
      neighbourValue: number;
      /** The cheaper neighbour can share the draft's monthly price, so it does not always cost less. */
      neighbourCostsSame: boolean;
    }
  | {
      type: "yearly_more_expensive_than_monthly";
      severity: DraftWarningSeverity;
      yearlyPrice: number;
      twelveMonthsPrice: number;
    }
  | {
      type: "yearly_fewer_credits_than_monthly";
      severity: DraftWarningSeverity;
      yearlyCredits: number;
      twelveMonthsCredits: number;
    }
  | { type: "free_plan_bills_overage"; severity: DraftWarningSeverity }
  | { type: "blocked_without_credit_packs"; severity: DraftWarningSeverity }
  | {
      type: "feature_worse_than_cheaper_plan";
      severity: DraftWarningSeverity;
      planCode: string;
      feature: CatalogFeature;
      neighbourValue: FeatureValue;
      draftValue: FeatureValue;
      neighbourCostsSame: boolean;
    }
  | {
      type: "feature_better_than_pricier_plan";
      severity: DraftWarningSeverity;
      planCode: string;
      feature: CatalogFeature;
      neighbourValue: FeatureValue;
      draftValue: FeatureValue;
    };

export type LadderStep = {
  fromPlanCode: string;
  fromPlanName: string;
  priceDifference: number;
  creditsDifference: number;
  /**
   * How much cheaper 1,000 included credits are than on the plan below, as a ratio (0.04 = 4%
   * cheaper; negative when dearer). `null` when the plan below gives its credits for free, since
   * nothing is cheaper than free.
   */
  pricePerCreditSavings: number | null;
};

export type CreditPackSummary = {
  code: string;
  name: string;
  credits: number;
  price: number;
  pricePerThousandCredits: number | null;
  expiresAfterDays: number;
  planCodes: string[];
};

export type PackComparison = {
  cheapestPack: CreditPackSummary;
  /**
   * How much cheaper the pack is than the plan's overage, as a ratio (0.27 = 27% cheaper).
   * Negative when the pack costs more. `null` when the plan does not bill overage.
   */
  savingsVersusOverage: number | null;
};

export type LadderRow = {
  plan: PlanSummary;
  /** Difference with the next cheaper plan; `null` for the first plan or without monthly prices. */
  step: LadderStep | null;
  /** `null` when no credit pack is available to the plan. */
  packComparison: PackComparison | null;
};

export type PackPlanComparison = {
  planCode: string;
  planName: string;
  isAvailable: boolean;
  exhaustionPolicy: ExhaustionPolicy;
  /** Only set when the pack is available and the plan bills overage. */
  savingsVersusOverage: number | null;
};

export type CreditPackRow = {
  pack: CreditPackSummary;
  plans: PackPlanComparison[];
};

/** A feature as configured in the version being viewed, next to what new customers get today. */
export type FeatureRow = ResolvedFeature & {
  currentValue: FeatureValue;
  /** `false` when viewing the current version itself. */
  differsFromCurrent: boolean;
};

export type FeatureRowsByType = {
  credit: FeatureRow[];
  capacity: FeatureRow[];
  boolean: FeatureRow[];
};

export type PlanDetail = {
  plan: PlanSummary;
  /** Oldest first, as `getVersionTimeline` returns it; the page decides the display order. */
  timeline: TimelineEntry[];
  alerts: CatalogAlert[];
  packComparison: PackComparison | null;
};

/**
 * What a new plan copies from an existing one: pricing, policy and the features of the version
 * new customers get today. Never the identity (name, code, visibility): the new plan is its own.
 */
export type DraftBase = {
  code: string;
  name: string;
  currentReleaseVersion: number;
  /** For showing the option; the draft itself reads `pricing`. */
  monthly: PeriodPricing | null;
  pricing: PlanPricing;
  exhaustionPolicy: ExhaustionPolicy;
  features: ReleaseFeature[];
};

export type DraftWarningsBySeverity = Record<DraftWarningSeverity, DraftWarning[]>;
