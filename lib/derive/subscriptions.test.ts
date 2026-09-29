import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import {
  getCatalogTotals,
  getReleaseSubscriptions,
  getVersionSplit,
  toWholePercentages,
} from "@/lib/derive/subscriptions";
import { cloneCatalog, getPlan } from "@/lib/derive/test-helpers";

describe("getCatalogTotals", () => {
  it("sums customers and those on retired versions", () => {
    expect(getCatalogTotals(catalog)).toEqual({
      totalCustomers: 2345,
      customersOnRetiredVersions: 456,
      planCount: 5,
      publicPlanCount: 4,
    });
  });

  it("ignores subscription rows that point to a missing release", () => {
    const edited = cloneCatalog();
    edited.subscriptionsByRelease.push({ planCode: "growth", version: 9, subscriptions: 100 });
    expect(getCatalogTotals(edited).totalCustomers).toBe(2345);
  });
});

describe("getReleaseSubscriptions", () => {
  it("returns zero for a release without a subscription row", () => {
    expect(getReleaseSubscriptions(catalog, "growth", 9)).toBe(0);
  });
});

describe("getVersionSplit", () => {
  it("returns zero shares for a plan without customers", () => {
    const edited = cloneCatalog();
    edited.subscriptionsByRelease = edited.subscriptionsByRelease.filter(
      (row) => row.planCode !== "scale",
    );
    const split = getVersionSplit(edited, getPlan("scale", edited));
    expect(split.map((share) => [share.share, share.percent])).toEqual([[0, 0], [0, 0]]);
  });
});

describe("toWholePercentages", () => {
  it("always adds up to 100", () => {
    expect(toWholePercentages([1, 1, 1])).toEqual([34, 33, 33]);
    expect(toWholePercentages([12, 340, 46])).toEqual([3, 85, 12]);
  });

  it("returns zeros when there is nothing to split", () => {
    expect(toWholePercentages([0, 0])).toEqual([0, 0]);
  });
});
