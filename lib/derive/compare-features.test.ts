import { describe, expect, it } from "vitest";
import { compareFeatureValues } from "@/lib/derive/compare-features";
import type { FeatureValue } from "@/lib/derive/types";

const notIncluded: FeatureValue = { kind: "not_included" };
const credit = (creditsPerUnit: number): FeatureValue => ({ kind: "credit", creditsPerUnit });
const toggle = (enabled: boolean): FeatureValue => ({ kind: "boolean", enabled });
const unlimited: FeatureValue = { kind: "capacity", limit: { type: "unlimited" } };
const billed = (includedAmount: number, unitPrice: number): FeatureValue => ({
  kind: "capacity",
  limit: { type: "limited", includedAmount, overage: { type: "billed", unitPrice } },
});
const blocked = (includedAmount: number): FeatureValue => ({
  kind: "capacity",
  limit: { type: "limited", includedAmount, overage: { type: "blocked" } },
});

describe("compareFeatureValues", () => {
  it("treats fewer credits per unit as better", () => {
    expect(compareFeatureValues(credit(6), credit(5))).toBe("better");
    expect(compareFeatureValues(credit(5), credit(6))).toBe("worse");
    expect(compareFeatureValues(credit(5), credit(5))).toBe("neutral");
  });

  it("treats gaining a feature as better and losing it as worse", () => {
    expect(compareFeatureValues(notIncluded, credit(30))).toBe("better");
    expect(compareFeatureValues(credit(30), notIncluded)).toBe("worse");
    expect(compareFeatureValues(toggle(false), toggle(true))).toBe("better");
    expect(compareFeatureValues(toggle(true), toggle(false))).toBe("worse");
  });

  it("treats an absent feature and a disabled boolean as equally unavailable", () => {
    expect(compareFeatureValues(notIncluded, toggle(false))).toBe("neutral");
    expect(compareFeatureValues(toggle(false), notIncluded)).toBe("neutral");
  });

  it("treats more included capacity as better", () => {
    expect(compareFeatureValues(billed(100, 12), billed(250, 12))).toBe("better");
    expect(compareFeatureValues(billed(250, 12), billed(100, 12))).toBe("worse");
  });

  it("treats unlimited as better than any limit", () => {
    expect(compareFeatureValues(billed(5000, 8), unlimited)).toBe("better");
    expect(compareFeatureValues(unlimited, billed(5000, 8))).toBe("worse");
    expect(compareFeatureValues(unlimited, unlimited)).toBe("neutral");
  });

  it("treats a blocked overage as worse than a billed one", () => {
    expect(compareFeatureValues(blocked(5), billed(5, 15))).toBe("better");
    expect(compareFeatureValues(billed(5, 15), blocked(5))).toBe("worse");
  });

  it("treats a cheaper billed overage as better", () => {
    expect(compareFeatureValues(billed(5, 1500), billed(5, 1200))).toBe("better");
    expect(compareFeatureValues(billed(5, 1200), billed(5, 1500))).toBe("worse");
  });

  it("reports a trade-off between amount and overage as neutral", () => {
    expect(compareFeatureValues(billed(5, 1500), blocked(10))).toBe("neutral");
    expect(compareFeatureValues(billed(10, 1200), billed(5, 1000))).toBe("neutral");
  });

  it("agrees when amount and overage both improve", () => {
    expect(compareFeatureValues(blocked(2), billed(3, 1500))).toBe("better");
  });
});
