import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { isCatalog } from "./validate-catalog";

describe("isCatalog", () => {
  it("accepts Nimbus and an empty company using the same Catalog shape", () => {
    expect(isCatalog(catalog)).toBe(true);
    expect(isCatalog({ organization: catalog.organization, features: [], plans: [], creditPacks: [], subscriptionsByRelease: [] })).toBe(true);
  });
  it.each([null, [], {}, { organization: {} }, { ...catalog, features: null }, { ...catalog, plans: {} },
    { ...catalog, organization: { ...catalog.organization, currency: "not a currency" } },
    { ...catalog, features: [{ code: "image", name: "Image", type: "credit" }] },
    { ...catalog, plans: [{ ...catalog.plans[0], releases: [] }] },
    { ...catalog, plans: [{ ...catalog.plans[0], pricing: { type: "standard", prices: [] } }] },
    { ...catalog, plans: [{ ...catalog.plans[0], pricing: { type: "free", includedCredits: -1 } }] },
    { ...catalog, plans: [{ ...catalog.plans[0], exhaustionPolicy: { type: "unknown" } }] },
    { ...catalog, plans: [{ ...catalog.plans[0], currentReleaseVersion: 999 }] },
  ])("rejects missing fields, invalid unions and broken current-release references", (value) => {
    expect(isCatalog(value)).toBe(false);
  });
  it("rejects duplicate identities and dangling catalog references", () => {
    expect(isCatalog({ ...catalog, features: [...catalog.features, catalog.features[0]] })).toBe(false);
    expect(isCatalog({ ...catalog, plans: [...catalog.plans, catalog.plans[0]] })).toBe(false);
    expect(isCatalog({ ...catalog, features: [] })).toBe(false);
    expect(isCatalog({ ...catalog, creditPacks: [{ ...catalog.creditPacks[0], planCodes: ["missing"] }] })).toBe(false);
    expect(isCatalog({ ...catalog, subscriptionsByRelease: [{ planCode: "missing", version: 1, subscriptions: 0 }] })).toBe(false);
  });
  it.each([-1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, "10"])("rejects unsafe numeric values", (number) => {
    expect(isCatalog({ ...catalog, subscriptionsByRelease: [{ ...catalog.subscriptionsByRelease[0], subscriptions: number }] })).toBe(false);
  });
  it("checks nested feature measurements and type references", () => {
    const value = structuredClone(catalog);
    value.plans[0].releases[0].features = [{ code: "ai_generation", type: "boolean", enabled: true }];
    expect(isCatalog(value)).toBe(false);
    value.plans[0].releases[0].features = [{ code: "storage_gb", type: "capacity", limit: { type: "limited", includedAmount: 10, overage: { type: "billed", unitPrice: -1 } } }];
    expect(isCatalog(value)).toBe(false);
  });
});
