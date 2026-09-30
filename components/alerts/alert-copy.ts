import type { CatalogAlert } from "@/lib/derive/types";
import { formatNumber, formatPercent } from "@/lib/format";

export type AlertCopy = {
  title: string;
  detail: string;
  /** A few words for places that already name the plan, such as its own card. */
  short: string;
  /** How the situation came about, for the plan's own page where there is room to explain. */
  context?: string;
};

/**
 * Wording for each alert. Lives beside the components rather than in lib/derive so the
 * derived data stays free of presentation decisions.
 */
export function describeCatalogAlert(alert: CatalogAlert, planNames: Map<string, string>): AlertCopy {
  const planName = planNames.get(alert.planCode) ?? alert.planCode;

  switch (alert.type) {
    case "majority_on_retired":
      return {
        title: `${formatPercent(alert.retiredShare)} of ${planName} customers are on retired versions`,
        detail:
          `${formatNumber(alert.retiredSubscriptions)} of ${formatNumber(alert.totalSubscriptions)} pay today's price ` +
          "with older features.",
        short: `${formatPercent(alert.retiredShare)} on retired versions`,
        context:
          "Existing customers stay on the version they subscribed to until they are migrated; " +
          `new customers join v${alert.currentReleaseVersion}, the current one.`,
      };
    case "release_without_customers":
      return alert.status === "published"
        ? {
            title: `Nobody is on ${planName} v${alert.version}`,
            detail: "It is the version new customers get, but no one has subscribed to it yet.",
            short: `No customers on v${alert.version}`,
          }
        : {
            title: `${planName} v${alert.version} has no customers left`,
            detail: "It is retired and nobody is on it, so changes to it affect no one.",
            short: `v${alert.version} has no customers`,
          };
    case "orphan_subscriptions":
      return {
        title: `${formatNumber(alert.subscriptions)} subscriptions point to ${planName} v${alert.version}, which does not exist`,
        detail: "They are left out of every total on this page until the data is fixed.",
        short: `${formatNumber(alert.subscriptions)} subscriptions on a missing version`,
      };
    case "current_version_mismatch":
      return {
        title: `${planName}'s current version is not its published one`,
        detail:
          `New customers are set to get v${alert.currentReleaseVersion}, but ` +
          (alert.publishedVersions.length === 0
            ? "no version is published."
            : `the published ${alert.publishedVersions.length === 1 ? "version is" : "versions are"} ` +
              `${alert.publishedVersions.map((version) => `v${version}`).join(", ")}.`),
        short: "Current version is not published",
      };
    case "blocked_without_credit_packs":
      return {
        title: `${planName} customers cannot buy more credits`,
        detail: "Service stops at zero and no credit pack is sold on this plan, so upgrading is the only way to continue.",
        short: "No way to buy more credits",
      };
  }
}
