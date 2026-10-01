import type { Catalog, CatalogFeature, CreditPack, Plan, PlanPrice, PlanRelease, ReleaseFeature, ReleaseSubscriptions } from "@/lib/catalog";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function amount(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }
function positive(value: unknown): value is number { return amount(value) && value > 0; }
function list<T>(value: unknown, validate: (entry: unknown) => entry is T): value is T[] {
  return Array.isArray(value) && value.every(validate);
}
function unique<T>(values: T[], key: (value: T) => string | number): boolean {
  return new Set(values.map(key)).size === values.length;
}

function catalogFeature(value: unknown): value is CatalogFeature {
  if (!record(value) || !text(value.code) || !text(value.name)) return false;
  return value.type === "boolean" || ((value.type === "credit" || value.type === "capacity") && text(value.unit));
}
function releaseFeature(value: unknown): value is ReleaseFeature {
  if (!record(value) || !text(value.code)) return false;
  if (value.type === "boolean") return typeof value.enabled === "boolean";
  if (value.type === "credit") return amount(value.creditsPerUnit);
  if (value.type !== "capacity" || !record(value.limit)) return false;
  const limit = value.limit;
  if (limit.type === "unlimited") return true;
  if (limit.type !== "limited" || !amount(limit.includedAmount) || !record(limit.overage)) return false;
  return limit.overage.type === "blocked" || (limit.overage.type === "billed" && amount(limit.overage.unitPrice));
}
function price(value: unknown): value is PlanPrice {
  return record(value) && text(value.id) && (value.billingInterval === "monthly" || value.billingInterval === "yearly")
    && amount(value.price) && amount(value.includedCredits) && typeof value.isDefault === "boolean";
}
function release(value: unknown): value is PlanRelease {
  return record(value) && positive(value.version)
    && (value.status === "published" || value.status === "retired" || value.status === "building")
    && typeof value.publishedAt === "string"
    && ((value.status === "building" && value.publishedAt === "") || Number.isFinite(Date.parse(value.publishedAt)))
    && list(value.features, releaseFeature) && unique(value.features, (feature) => feature.code);
}
function plan(value: unknown): value is Plan {
  if (!record(value) || !text(value.id) || !text(value.code) || !text(value.name)
    || typeof value.description !== "string" || typeof value.isPublic !== "boolean" || typeof value.isDefault !== "boolean"
    || !positive(value.currentReleaseVersion) || !record(value.pricing) || !record(value.exhaustionPolicy)) return false;
  const pricing = value.pricing;
  const pricingValid = pricing.type === "free" ? amount(pricing.includedCredits)
    : pricing.type === "standard" && list(pricing.prices, price) && pricing.prices.length > 0
      && unique(pricing.prices, (entry) => entry.id) && unique(pricing.prices, (entry) => entry.billingInterval);
  const policy = value.exhaustionPolicy;
  const policyValid = policy.type === "block" || (policy.type === "bill_overage" && amount(policy.pricePer1000Credits));
  return pricingValid && policyValid && list(value.releases, release) && value.releases.length > 0
    && unique(value.releases, (entry) => entry.version)
    && value.releases.some((entry) => entry.version === value.currentReleaseVersion);
}
function pack(value: unknown): value is CreditPack {
  return record(value) && text(value.id) && text(value.code) && text(value.name)
    && amount(value.credits) && amount(value.price) && amount(value.expiresAfterDays)
    && list(value.planCodes, text) && unique(value.planCodes, (code) => code);
}
function subscription(value: unknown): value is ReleaseSubscriptions {
  return record(value) && text(value.planCode) && positive(value.version) && amount(value.subscriptions);
}

/** Validate browser-owned JSON before it reaches code that trusts the Catalog type. */
export function isCatalog(value: unknown): value is Catalog {
  if (!record(value) || !record(value.organization)) return false;
  const organization = value.organization;
  if (!text(organization.id) || !text(organization.name) || typeof organization.description !== "string"
    || typeof organization.currency !== "string" || !/^[A-Z]{3}$/.test(organization.currency)) return false;
  if (!list(value.features, catalogFeature) || !list(value.plans, plan)
    || !list(value.creditPacks, pack) || !list(value.subscriptionsByRelease, subscription)) return false;
  if (!unique(value.features, (entry) => entry.code) || !unique(value.plans, (entry) => entry.code)
    || !unique(value.plans, (entry) => entry.id) || !unique(value.creditPacks, (entry) => entry.code)
    || !unique(value.creditPacks, (entry) => entry.id)
    || !unique(value.subscriptionsByRelease, (entry) => `${entry.planCode}:${entry.version}`)) return false;
  const featureTypes = new Map(value.features.map((entry) => [entry.code, entry.type]));
  const plans = new Map(value.plans.map((entry) => [entry.code, entry]));
  return value.plans.every((entry) => entry.releases.every((version) => version.features.every(
    (feature) => featureTypes.get(feature.code) === feature.type,
  ))) && value.creditPacks.every((entry) => entry.planCodes.every((code) => plans.has(code)))
    && value.subscriptionsByRelease.every((entry) => plans.get(entry.planCode)?.releases.some(
      (version) => version.version === entry.version,
    ));
}
