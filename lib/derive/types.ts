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
  planCount: number;
  publicPlanCount: number;
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
    }
  | {
      type: "feature_better_than_pricier_plan";
      severity: DraftWarningSeverity;
      planCode: string;
      feature: CatalogFeature;
      neighbourValue: FeatureValue;
      draftValue: FeatureValue;
    };
