import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { getCatalogAlerts } from "@/lib/derive/alerts";
import { cloneCatalog, getPlan } from "@/lib/derive/test-helpers";

describe("getCatalogAlerts", () => {
  it("flags Growth, where most customers are on retired versions", () => {
    const alerts = getCatalogAlerts(catalog);
    const majority = alerts.filter((alert) => alert.type === "majority_on_retired");
    expect(majority).toEqual([
      {
        type: "majority_on_retired",
        severity: "warning",
        planCode: "growth",
        retiredSubscriptions: 352,
        totalSubscriptions: 398,
        retiredShare: 352 / 398,
        currentReleaseVersion: 3,
      },
    ]);
  });

  it("only reports the free plan's missing credit packs besides that", () => {
    expect(getCatalogAlerts(catalog).map((alert) => `${alert.type}:${alert.planCode}`)).toEqual([
      "majority_on_retired:growth",
      "blocked_without_credit_packs:free",
    ]);
  });

  it("does not flag a plan at exactly half on retired versions", () => {
    const edited = cloneCatalog();
    edited.subscriptionsByRelease = edited.subscriptionsByRelease.map((row) =>
      row.planCode === "scale" ? { ...row, subscriptions: 50 } : row,
    );
    const flagged = getCatalogAlerts(edited).filter(
      (alert) => alert.type === "majority_on_retired" && alert.planCode === "scale",
    );
    expect(flagged).toEqual([]);
  });

  it("reports subscriptions pointing to a release that does not exist", () => {
    const edited = cloneCatalog();
    edited.subscriptionsByRelease.push({ planCode: "starter", version: 7, subscriptions: 3 });
    expect(getCatalogAlerts(edited)[0]).toMatchObject({
      type: "orphan_subscriptions",
      severity: "critical",
      planCode: "starter",
      version: 7,
    });
  });

  it("reports a current version that is not the published one", () => {
    const edited = cloneCatalog();
    getPlan("scale", edited).currentReleaseVersion = 1;
    expect(getCatalogAlerts(edited)[0]).toMatchObject({
      type: "current_version_mismatch",
      planCode: "scale",
      publishedVersions: [2],
    });
  });

  it("warns about a published version with no customers, but not about a draft", () => {
    const edited = cloneCatalog();
    edited.subscriptionsByRelease = edited.subscriptionsByRelease.filter(
      (row) => row.planCode !== "enterprise",
    );
    getPlan("enterprise", edited).releases.push({
      version: 2,
      status: "building",
      publishedAt: "2026-09-01T00:00:00Z",
      features: [],
    });
    const empty = getCatalogAlerts(edited).filter(
      (alert) => alert.type === "release_without_customers",
    );
    expect(empty).toEqual([
      {
        type: "release_without_customers",
        severity: "warning",
        planCode: "enterprise",
        version: 1,
        status: "published",
      },
    ]);
  });
});
