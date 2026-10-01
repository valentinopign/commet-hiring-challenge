import { describe, expect, it } from "vitest";
import { compareExhaustionPolicies } from "./exhaustion-policy";

const block = { type: "block" } as const;
const overage = (pricePer1000Credits: number) => ({ type: "bill_overage", pricePer1000Credits }) as const;

describe("compareExhaustionPolicies", () => {
  it("treats switching between blocking and billing overage as a trade-off in both directions", () => {
    expect(compareExhaustionPolicies(block, overage(1500))).toBe("neutral");
    expect(compareExhaustionPolicies(overage(1500), block)).toBe("neutral");
  });
  it("prefers a lower overage price when both bill overage", () => {
    expect(compareExhaustionPolicies(overage(1500), overage(1200))).toBe("better");
    expect(compareExhaustionPolicies(overage(1200), overage(1500))).toBe("worse");
  });
  it("returns no impact for equal policies", () => {
    expect(compareExhaustionPolicies(block, block)).toBeNull();
    expect(compareExhaustionPolicies(overage(1500), overage(1500))).toBeNull();
  });
});
