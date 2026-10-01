import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { getCustomerDistribution, getRampStep } from "@/lib/derive/customer-distribution";
import { cloneCatalog } from "@/lib/derive/test-helpers";

describe("getCustomerDistribution", () => {
  const distribution = getCustomerDistribution(catalog);

  it("splits every customer across plans, cheapest first", () => {
    expect(distribution.totalCustomers).toBe(2345);
    expect(distribution.segments.map((segment) => [segment.planCode, segment.customers, segment.percent])).toEqual([
      ["free", 1240, 53],
      ["starter", 588, 25],
      ["growth", 398, 17],
      ["scale", 112, 5],
      ["enterprise", 7, 0],
    ]);
  });

  it("keeps percentages at exactly 100 even when a plan rounds to 0%", () => {
    expect(distribution.segments.reduce((total, segment) => total + segment.percent, 0)).toBe(100);
    expect(distribution.segments[4].share).toBeCloseTo(7 / 2345);
  });

  it("ranks paid plans and leaves the free plan out of the ranking", () => {
    expect(distribution.paidPlanCount).toBe(4);
    expect(distribution.segments.map((segment) => [segment.isPaid, segment.paidRank])).toEqual([
      [false, null],
      [true, 0],
      [true, 1],
      [true, 2],
      [true, 3],
    ]);
  });

  it("names the plan with the most customers", () => {
    expect(distribution.largest?.planCode).toBe("free");
  });

  it("has no largest plan and zero shares without customers", () => {
    const edited = cloneCatalog();
    edited.subscriptionsByRelease = [];
    const empty = getCustomerDistribution(edited);
    expect(empty.totalCustomers).toBe(0);
    expect(empty.largest).toBeNull();
    expect(empty.segments.every((segment) => segment.share === 0 && segment.percent === 0)).toBe(true);
  });
});

describe("getRampStep", () => {
  it("spreads paid plans over the whole ramp", () => {
    expect([0, 1, 2, 3].map((rank) => getRampStep(rank, 4, 4))).toEqual([0, 1, 2, 3]);
    expect([0, 1].map((rank) => getRampStep(rank, 2, 4))).toEqual([0, 3]);
  });

  it("gives a single paid plan the darkest step", () => {
    expect(getRampStep(0, 1, 4)).toBe(3);
  });

  it("lets neighbours share a step when plans outnumber steps", () => {
    expect([0, 1, 2, 3, 4, 5].map((rank) => getRampStep(rank, 6, 4))).toEqual([0, 1, 1, 2, 2, 3]);
  });
});
