/** Every monetary value is in cents: 100 = $1.00 */

export type Overage =
  | { type: "billed"; unitPrice: number }
  | { type: "blocked" };

export type CapacityLimit =
  | { type: "unlimited" }
  | { type: "limited"; includedAmount: number; overage: Overage };

export type CatalogFeature =
  | { code: string; name: string; type: "credit"; unit: string }
  | { code: string; name: string; type: "capacity"; unit: string }
  | { code: string; name: string; type: "boolean" };

export type ReleaseFeature =
  | { code: string; type: "credit"; creditsPerUnit: number }
  | { code: string; type: "capacity"; limit: CapacityLimit }
  | { code: string; type: "boolean"; enabled: boolean };

export type ReleaseStatus = "building" | "published" | "retired";

export type PlanRelease = {
  version: number;
  status: ReleaseStatus;
  publishedAt: string;
  features: ReleaseFeature[];
};

export type BillingInterval = "monthly" | "yearly";

export type PlanPrice = {
  id: string;
  billingInterval: BillingInterval;
  price: number;
  includedCredits: number;
  isDefault: boolean;
};

export type PlanPricing =
  | { type: "free"; includedCredits: number }
  | { type: "standard"; prices: [PlanPrice, ...PlanPrice[]] };

export type ExhaustionPolicy =
  | { type: "block" }
  | { type: "bill_overage"; pricePer1000Credits: number };

export type Plan = {
  id: string;
  code: string;
  name: string;
  description: string;
  isPublic: boolean;
  isDefault: boolean;
  pricing: PlanPricing;
  exhaustionPolicy: ExhaustionPolicy;
  currentReleaseVersion: number;
  releases: [PlanRelease, ...PlanRelease[]];
};

export type CreditPack = {
  id: string;
  code: string;
  name: string;
  credits: number;
  price: number;
  expiresAfterDays: number;
  planCodes: string[];
};

/** Live state. Never stored inside the plan definition, which is shared by every subscription. */
export type ReleaseSubscriptions = {
  planCode: string;
  version: number;
  subscriptions: number;
};

export type Catalog = {
  organization: {
    id: string;
    name: string;
    description: string;
    currency: string;
  };
  features: CatalogFeature[];
  plans: Plan[];
  creditPacks: CreditPack[];
  subscriptionsByRelease: ReleaseSubscriptions[];
};
