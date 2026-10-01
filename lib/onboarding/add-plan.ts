import type { Catalog, Plan } from "@/lib/catalog";
import type { DraftPlan } from "@/lib/derive/types";

/** Local simulated publication: a snapshot with v1 and no customers, never changes Nimbus. */
export function addOnboardingPlan(catalog: Catalog, draft: DraftPlan, publishedAt: string): Catalog {
  if (catalog.plans.some((plan) => plan.code === draft.code)) return catalog;
  const plan: Plan = {
    id: `onboarding_${draft.code}`,
    code: draft.code,
    name: draft.name,
    description: "",
    isPublic: draft.isPublic,
    isDefault: catalog.plans.length === 0,
    pricing: structuredClone(draft.pricing),
    exhaustionPolicy: { ...draft.exhaustionPolicy },
    currentReleaseVersion: 1,
    releases: [{ version: 1, status: "published", publishedAt, features: structuredClone(draft.features) }],
  };
  return {
    ...catalog,
    plans: [...catalog.plans, plan],
    creditPacks: catalog.creditPacks.map((pack) => draft.creditPackCodes.includes(pack.code)
      ? { ...pack, planCodes: [...pack.planCodes, plan.code] } : pack),
  };
}
