import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { comparePeriodPricing, comparePlanContext, getComparedFeatureRows, getComparisonOptions, numericComparisonImpact, planComparisonHref, resolveComparisonTarget } from "@/lib/derive/compare-plans";
import { getPlanDetail } from "@/lib/derive/plan-detail";
import { cloneCatalog, getPlan } from "@/lib/derive/test-helpers";
import type { PlanDetail, TimelineEntry } from "@/lib/derive/types";

function detail(code: string): PlanDetail {
  const result = getPlanDetail(catalog, code);
  if (!result) throw new Error(`Missing plan ${code}`);
  return result;
}
function version(code: string, number: number): TimelineEntry {
  const result = detail(code).timeline.find((entry) => entry.version === number);
  if (!result) throw new Error(`Missing version ${code}.${number}`);
  return result;
}

describe("comparison selection", () => {
  it("defaults to the published version and preserves an explicit retired one", () => {
    expect(resolveComparisonTarget(catalog, "growth", "scale")?.parameter).toBe("scale.2");
    expect(resolveComparisonTarget(catalog, "growth", "scale.1")?.viewed.isCurrent).toBe(false);
    expect(resolveComparisonTarget(catalog, "growth", ["scale.1", "starter.2"])?.parameter).toBe("scale.1");
  });
  it("falls back to the current version for a stale version number", () => {
    expect(resolveComparisonTarget(catalog, "growth", "scale.999")?.parameter).toBe("scale.2");
  });
  it("rejects unknown, malformed, empty targets and gives edit priority", () => {
    for (const input of [undefined, "", "missing.1", "scale.v2"]) {
      expect(resolveComparisonTarget(catalog, "growth", input)).toBeNull();
    }
    expect(resolveComparisonTarget(catalog, "growth", "scale.2", true)).toBeNull();
  });
  it("lists the plan's other versions first, then other plans in ladder order", () => {
    const options = getComparisonOptions(catalog, "growth");
    expect(options.map((option) => option.code)).toEqual(["growth", "free", "starter", "scale", "enterprise"]);
    expect(options[0].versions.map((entry) => entry.version)).toEqual([2, 1]);
    expect(options.at(-1)?.isPublic).toBe(false);
    expect(options.find((option) => option.code === "scale")?.versions.map((entry) => entry.version)).toEqual([2, 1]);
    const single = cloneCatalog();
    single.plans = [getPlan("growth", single)];
    expect(getComparisonOptions(single, "growth")[0].versions.map((entry) => entry.version)).toEqual([2, 1]);
    single.plans[0].releases = [single.plans[0].releases[0]];
    expect(getComparisonOptions(single, "growth")).toEqual([]);
  });
  it("compares versions of the same plan and excludes the viewed version from its selector", () => {
    const target = resolveComparisonTarget(catalog, "starter", "starter.1");
    expect(target).toMatchObject({ parameter: "starter.1", isSamePlan: true });
    const fromCurrent = getComparisonOptions(catalog, "starter", 2)[0];
    expect(fromCurrent.versions.map((entry) => entry.version)).toEqual([1]);
    expect(fromCurrent.defaultVersion).toBe(1);
    const fromRetired = getComparisonOptions(catalog, "starter", 1)[0];
    expect(fromRetired.defaultVersion).toBe(2);
    expect(target?.detail.plan.monthly).toEqual(detail("starter").plan.monthly);
    expect(getComparedFeatureRows(version("starter", 2), version("starter", 1)).differences).toBeGreaterThan(0);
  });
  it("uses each company's catalog rather than fixed Nimbus plan codes", () => {
    const local = cloneCatalog();
    local.organization.id = "local-company";
    const scale = getPlan("scale", local);
    scale.code = "custom-tier";
    scale.name = "Custom tier";
    const target = resolveComparisonTarget(local, "growth", "custom-tier.1");
    expect(target?.detail.plan.name).toBe("Custom tier");
    expect(target?.parameter).toBe("custom-tier.1");
  });
});

describe("comparison feature rows", () => {
  it("pairs every catalog feature in order and only labels differing right-hand values", () => {
    const result = getComparedFeatureRows(version("growth", 3), version("scale", 1));
    expect(result.total).toBe(12);
    const generations = result.groups.credit.find((row) => row.feature.code === "ai_generation");
    expect(generations?.differs).toBe(false);
    expect(generations?.impact).toBeNull();
    expect(result.groups.capacity.map((row) => row.feature.code)).toEqual(["storage_gb", "workspaces", "seats"]);
    expect(result.groups.capacity.find((row) => row.feature.code === "storage_gb")?.impact).toBe("better");
    const filtered = getComparedFeatureRows(version("growth", 3), version("scale", 1), true);
    expect(Object.values(filtered.groups).flat()).toHaveLength(result.differences);
    expect(Object.values(filtered.groups).flat().every((row) => row.differs)).toBe(true);
  });
  it("reverses impact when the comparison direction changes", () => {
    const before = version("growth", 3);
    const after = version("scale", 2);
    const forward = getComparedFeatureRows(before, after).groups.credit.find((row) => row.feature.code === "ai_generation");
    const reverse = getComparedFeatureRows(after, before).groups.credit.find((row) => row.feature.code === "ai_generation");
    expect(forward?.impact).toBe("better");
    expect(reverse?.impact).toBe("worse");
  });
  it("treats missing and disabled access equally and detects gains and removals", () => {
    const baseline = version("growth", 3);
    const access = baseline.features.find((entry) => entry.feature.type === "boolean");
    if (!access) throw new Error("Missing access fixture");
    const left = { ...baseline, features: [{ ...access, value: { kind: "not_included" as const } }] };
    const right = { ...baseline, features: [{ ...access, value: { kind: "boolean" as const, enabled: false } }] };
    expect(getComparedFeatureRows(left, right, true).differences).toBe(0);
    right.features[0].value.enabled = true;
    expect(getComparedFeatureRows(left, right).groups.boolean[0].impact).toBe("better");
    expect(getComparedFeatureRows(right, left).groups.boolean[0].impact).toBe("worse");
  });
  it("labels opposing capacity and overage changes as a trade-off", () => {
    const baseline = version("growth", 3);
    const capacity = baseline.features.find((entry) => entry.feature.type === "capacity");
    if (!capacity) throw new Error("Missing capacity fixture");
    const left: TimelineEntry = { ...baseline, features: [{ ...capacity, value: { kind: "capacity", limit: { type: "limited", includedAmount: 10, overage: { type: "billed", unitPrice: 100 } } } }] };
    const right: TimelineEntry = { ...baseline, features: [{ ...capacity, value: { kind: "capacity", limit: { type: "limited", includedAmount: 20, overage: { type: "blocked" } } } }] };
    expect(getComparedFeatureRows(left, right).groups.capacity[0]).toMatchObject({ differs: true, impact: "neutral" });
  });
  it("supports unlimited capacity, missing credit features and entirely equal versions", () => {
    const scale = version("scale", 2);
    const enterprise = version("enterprise", 1);
    expect(getComparedFeatureRows(scale, enterprise).groups.capacity.some((row) => row.comparedValue.kind === "capacity" && row.comparedValue.limit.type === "unlimited" && row.impact === "better")).toBe(true);
    const removed: TimelineEntry = { ...scale, features: scale.features.filter((entry) => entry.feature.type !== "credit") };
    expect(getComparedFeatureRows(scale, removed).groups.credit.every((row) => row.comparedValue.kind === "not_included" && row.impact === "worse")).toBe(true);
    const equal = getComparedFeatureRows(scale, scale, true);
    expect(equal.differences).toBe(0);
    expect(Object.values(equal.groups).flat()).toEqual([]);
  });
});

describe("comparison pricing and URL transitions", () => {
  it("compares actual monthly and yearly values independently and handles Free", () => {
    const growth = detail("growth");
    const scale = detail("scale");
    expect(comparePeriodPricing(growth.plan.monthly, scale.plan.monthly).priceDelta).toBe(20000);
    expect(comparePeriodPricing(growth.plan.yearly, scale.plan.yearly).priceDelta).toBe(200000);
    expect(comparePeriodPricing(null, null).availabilityDiffers).toBe(false);
    expect(comparePeriodPricing(growth.plan.yearly, null)).toMatchObject({ availabilityDiffers: true, priceDelta: null, creditsDelta: null });
    expect(comparePeriodPricing(detail("free").plan.monthly, growth.plan.monthly).priceDelta).toBe(9900);
  });
  it("derives policy, pack and customer differences without assigning customer impact to totals", () => {
    expect(comparePlanContext(detail("growth"), detail("growth"))).toEqual({ customerDelta: 0, policyDiffers: false, policyImpact: null, packDiffers: false });
    expect(comparePlanContext(detail("free"), detail("growth"))).toMatchObject({ policyDiffers: true, packDiffers: true });
    expect(comparePlanContext(detail("growth"), detail("starter")).policyImpact).toBe("worse");
    expect(comparePlanContext(detail("starter"), detail("growth")).policyImpact).toBe("better");
    expect(comparePlanContext(detail("growth"), detail("free")).policyImpact).toBe("worse");
  });
  it("classifies lower prices and higher allowances individually, leaving missing/equal amounts neutral", () => {
    expect(numericComparisonImpact(-7000, "lower")).toBe("better");
    expect(numericComparisonImpact(7000, "lower")).toBe("worse");
    expect(numericComparisonImpact(-9000, "higher")).toBe("worse");
    expect(numericComparisonImpact(9000, "higher")).toBe("better");
    expect(numericComparisonImpact(0, "lower")).toBeNull();
    expect(numericComparisonImpact(null, "higher")).toBeNull();
  });
  it("preserves the selected left version and strips comparison filters on exit", () => {
    expect(planComparisonHref("growth", { version: 1, compare: "scale.2", onlyDifferences: true })).toBe("/plans/growth?version=1&compare=scale.2&diff=1");
    expect(planComparisonHref("growth", { version: 1, onlyDifferences: true })).toBe("/plans/growth?version=1");
  });
});
