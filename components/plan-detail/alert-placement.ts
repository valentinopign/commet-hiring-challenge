import type { CatalogAlert } from "@/lib/derive/types";

export type PlanAlertSection = "pricing" | "versions";

/**
 * Where an alert sits on the plan page: next to the data it explains, rather than above
 * everything. Running out of credits with no pack to buy is about pricing; every other alert is
 * about who is on which version.
 */
export function getAlertSection(alert: CatalogAlert): PlanAlertSection {
  switch (alert.type) {
    case "blocked_without_credit_packs":
      return "pricing";
    case "majority_on_retired":
    case "release_without_customers":
    case "orphan_subscriptions":
    case "current_version_mismatch":
      return "versions";
  }
}
