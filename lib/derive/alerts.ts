import type { Catalog } from "@/lib/catalog";
import { getCreditPacksForPlan } from "@/lib/derive/plans";
import { getReleaseSubscriptions } from "@/lib/derive/subscriptions";
import type { CatalogAlert, Severity } from "@/lib/derive/types";

/** "Most customers" means strictly more than half. */
export const RETIRED_MAJORITY_THRESHOLD = 0.5;

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

/** Every alert the overview should show, most severe first. */
export function getCatalogAlerts(catalog: Catalog): CatalogAlert[] {
  const alerts: CatalogAlert[] = [];

  for (const plan of catalog.plans) {
    const publishedVersions = plan.releases
      .filter((release) => release.status === "published")
      .map((release) => release.version);
    const currentIsPublished = publishedVersions.includes(plan.currentReleaseVersion);
    if (!currentIsPublished || publishedVersions.length !== 1) {
      alerts.push({
        type: "current_version_mismatch",
        severity: "critical",
        planCode: plan.code,
        currentReleaseVersion: plan.currentReleaseVersion,
        publishedVersions,
      });
    }

    let totalSubscriptions = 0;
    let retiredSubscriptions = 0;
    for (const release of plan.releases) {
      const subscriptions = getReleaseSubscriptions(catalog, plan.code, release.version);
      totalSubscriptions += subscriptions;
      if (release.status === "retired") retiredSubscriptions += subscriptions;
      // A draft has no customers by definition, so an empty one is not news.
      if (subscriptions === 0 && release.status !== "building") {
        alerts.push({
          type: "release_without_customers",
          // An empty retired version is harmless; an empty published one means nobody new is joining.
          severity: release.status === "published" ? "warning" : "info",
          planCode: plan.code,
          version: release.version,
          status: release.status,
        });
      }
    }

    const retiredShare = totalSubscriptions > 0 ? retiredSubscriptions / totalSubscriptions : 0;
    if (retiredShare > RETIRED_MAJORITY_THRESHOLD) {
      alerts.push({
        type: "majority_on_retired",
        severity: "warning",
        planCode: plan.code,
        retiredSubscriptions,
        totalSubscriptions,
        retiredShare,
        currentReleaseVersion: plan.currentReleaseVersion,
      });
    }

    if (
      plan.exhaustionPolicy.type === "block" &&
      getCreditPacksForPlan(catalog, plan.code).length === 0
    ) {
      alerts.push({ type: "blocked_without_credit_packs", severity: "info", planCode: plan.code });
    }
  }

  for (const row of catalog.subscriptionsByRelease) {
    const plan = catalog.plans.find((candidate) => candidate.code === row.planCode);
    const releaseExists = plan?.releases.some((release) => release.version === row.version);
    if (!releaseExists) {
      alerts.push({
        type: "orphan_subscriptions",
        severity: "critical",
        planCode: row.planCode,
        version: row.version,
        subscriptions: row.subscriptions,
      });
    }
  }

  // Array.prototype.sort is stable, so alerts of equal severity keep catalog order.
  return alerts.sort(
    (first, second) => SEVERITY_ORDER[first.severity] - SEVERITY_ORDER[second.severity],
  );
}
