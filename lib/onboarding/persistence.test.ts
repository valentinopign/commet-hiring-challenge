import { describe, expect, it } from "vitest";
import { catalog as nimbus } from "@/data/catalog";
import type { Catalog } from "@/lib/catalog";
import type { DraftPlan } from "@/lib/derive/types";
import { getCatalogAlerts } from "@/lib/derive/alerts";
import { getCustomerDistribution } from "@/lib/derive/customer-distribution";
import { getDraftBases } from "@/lib/derive/draft-flow";
import { getLadderRows } from "@/lib/derive/ladder";
import { getNavigationPlans } from "@/lib/derive/navigation";
import { getPlanDetail } from "@/lib/derive/plan-detail";
import { getCatalogTotals } from "@/lib/derive/subscriptions";
import { createOrganizationStore, ORGANIZATION_STORAGE_KEY } from "@/lib/organization-store";
import { isCatalog } from "@/lib/validate-catalog";
import { addOnboardingPlan } from "./add-plan";

const date = "2026-10-01T12:00:00.000Z";
function company(id: string): Catalog {
  return {
    organization: { id, name: "My company", description: "", currency: "USD" },
    features: [
      { code: "image", name: "Generate an image", type: "credit", unit: "generation" },
      { code: "users", name: "Users", type: "capacity", unit: "user" },
      { code: "support", name: "Priority support", type: "boolean" },
    ],
    plans: [], creditPacks: [], subscriptionsByRelease: [],
  };
}
function draft(code: string): DraftPlan {
  return {
    code, name: code, isPublic: true, basePlanCode: null,
    pricing: { type: "standard", prices: [
      { id: "draft_monthly", billingInterval: "monthly", price: 3000, includedCredits: 12500, isDefault: true },
      { id: "draft_yearly", billingInterval: "yearly", price: 25000, includedCredits: 100000, isDefault: false },
    ] },
    exhaustionPolicy: { type: "bill_overage", pricePer1000Credits: 500 },
    features: [
      { code: "image", type: "credit", creditsPerUnit: 5 },
      { code: "users", type: "capacity", limit: { type: "limited", includedAmount: 3, overage: { type: "blocked" } } },
      { code: "support", type: "boolean", enabled: true },
    ], creditPackCodes: [],
  };
}

describe("onboarding to persisted dashboard", () => {
  it("restores a full company and feeds every existing dashboard derive without Nimbus data", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const options = { builtInOrganizationId: nimbus.organization.id, storage: () => storage };
    const store = createOrganizationStore(options);
    const saved = addOnboardingPlan(addOnboardingPlan(company("org_one"), draft("starter"), date), draft("growth"), date);
    expect(isCatalog(saved)).toBe(true);
    expect(store.saveCatalog(saved)).toEqual({ ok: true, persistence: "local" });
    store.saveCatalog(addOnboardingPlan(company("org_two"), { ...draft("free"), pricing: { type: "free", includedCredits: 100 } }, date));

    const restored = createOrganizationStore(options);
    expect(restored.getSnapshot().hydrated).toBe(false);
    restored.hydrate();
    const first = restored.getSnapshot().organizations.find((item) => item.organization.id === "org_one");
    if (!first) throw new Error("Saved company was not restored");
    expect(first).toEqual(saved);
    expect(getLadderRows(first)).toHaveLength(2);
    expect(getNavigationPlans(first).map((item) => item.code)).toEqual(["growth", "starter"]);
    expect(getDraftBases(first)).toHaveLength(2);
    expect(getPlanDetail(first, "growth")?.timeline).toHaveLength(1);
    expect(getPlanDetail(first, "growth")?.plan.totalSubscriptions).toBe(0);
    expect(getPlanDetail(first, "business")).toBeNull();
    expect(() => getCustomerDistribution(first)).not.toThrow();
    expect(() => getCatalogAlerts(first)).not.toThrow();
    expect(getCatalogTotals(first).totalCustomers).toBe(0);

    // A new plan after setup updates only this company and survives another reload.
    expect(restored.saveCatalog(addOnboardingPlan(first, draft("pro"), date)).ok).toBe(true);
    expect(restored.getSnapshot().organizations.find((item) => item.organization.id === "org_two")?.plans).toHaveLength(1);
    const reloaded = createOrganizationStore(options);
    reloaded.hydrate();
    expect(reloaded.getSnapshot().organizations.find((item) => item.organization.id === "org_one")?.plans).toHaveLength(3);
    reloaded.selectOrganization(nimbus.organization.id);
    expect(reloaded.getSnapshot().organizations).toHaveLength(3);
    reloaded.resetDemo();
    expect(values.has(ORGANIZATION_STORAGE_KEY)).toBe(false);
    expect(reloaded.getSnapshot().organizations).toEqual([nimbus]);
    expect(nimbus.plans).toHaveLength(5);
  });
});
