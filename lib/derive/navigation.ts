import type { Catalog } from "@/lib/catalog";
import { getCatalogAlerts, needsAttention } from "@/lib/derive/alerts";
import { getPlanLadder } from "@/lib/derive/plans";

export type NavigationPlan = {
  code: string;
  name: string;
  needsAttention: boolean;
};

/** Plans for the sidebar, in ladder order, flagged when they have a pending warning. */
export function getNavigationPlans(catalog: Catalog): NavigationPlan[] {
  const flaggedCodes = new Set(
    getCatalogAlerts(catalog).filter(needsAttention).map((alert) => alert.planCode),
  );
  return getPlanLadder(catalog).map((plan) => ({
    code: plan.code,
    name: plan.name,
    needsAttention: flaggedCodes.has(plan.code),
  }));
}

export type OrganizationOption = { id: string; name: string };

/** Every organisation the switcher offers. The catalog describes a single one today. */
export function getOrganizations(catalog: Catalog): OrganizationOption[] {
  return [{ id: catalog.organization.id, name: catalog.organization.name }];
}
