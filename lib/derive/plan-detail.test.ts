import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import type { Catalog } from "@/lib/catalog";
import { getFeatureRows, getPlanDetail, groupFeaturesByType, resolveViewedVersion } from "@/lib/derive/plan-detail";
import { cloneCatalog, getPlan } from "@/lib/derive/test-helpers";

function detailOf(code: string, source: Catalog = catalog) {
  const detail = getPlanDetail(source, code);
  if (!detail) throw new Error(`No detail for ${code}`);
  return detail;
}

describe("getPlanDetail", () => {
  it("returns null for an unknown plan code", () => {
    expect(getPlanDetail(catalog, "does-not-exist")).toBeNull();
  });

  it("collects only the alerts about that plan", () => {
    const growth = detailOf("growth");
    expect(growth.alerts.length).toBeGreaterThan(0);
    expect(growth.alerts.every((alert) => alert.planCode === "growth")).toBe(true);
  });

  it("keeps every version of the plan, oldest first", () => {
    const growth = detailOf("growth");
    expect(growth.timeline.map((entry) => entry.version)).toEqual(
      getPlan("growth").releases.map((release) => release.version).sort((a, b) => a - b),
    );
  });

  it("has no pack comparison on a plan with no packs", () => {
    expect(detailOf("free").packComparison).toBeNull();
  });
});

describe("resolveViewedVersion", () => {
  const timeline = detailOf("growth").timeline;
  const current = getPlan("growth").currentReleaseVersion;

  it("uses a requested version that exists", () => {
    expect(resolveViewedVersion(timeline, "1", current)).toBe(1);
  });

  it.each([undefined, "", "v2", "2.5", "-1", "99", ["abc"]])(
    "falls back to the current version for %j",
    (requested) => {
      expect(resolveViewedVersion(timeline, requested, current)).toBe(current);
    },
  );

  it("takes the first value when the parameter repeats", () => {
    expect(resolveViewedVersion(timeline, ["1", "2"], current)).toBe(1);
  });

  it("falls back to the newest version when the current one is missing", () => {
    expect(resolveViewedVersion(timeline, undefined, 42)).toBe(timeline.at(-1)?.version);
  });
});

describe("groupFeaturesByType", () => {
  it("splits every catalog feature into exactly one group, in catalog order", () => {
    const groups = groupFeaturesByType(detailOf("growth").plan.currentFeatures);
    const total = groups.credit.length + groups.capacity.length + groups.boolean.length;
    expect(total).toBe(catalog.features.length);
    expect(groups.credit.map((entry) => entry.feature.code)).toEqual(
      catalog.features.filter((feature) => feature.type === "credit").map((feature) => feature.code),
    );
  });
});

describe("getFeatureRows", () => {
  it("marks nothing as different when viewing the current version", () => {
    const { timeline, plan } = detailOf("growth");
    const current = timeline.find((entry) => entry.version === plan.currentReleaseVersion);
    if (!current) throw new Error("Growth has no current version");
    const rows = getFeatureRows(current, current);
    expect([...rows.credit, ...rows.capacity, ...rows.boolean].some((row) => row.differsFromCurrent)).toBe(false);
  });

  it("marks exactly the features that changed since an older version", () => {
    const { timeline, plan } = detailOf("growth");
    const current = timeline.find((entry) => entry.version === plan.currentReleaseVersion);
    const oldest = timeline[0];
    if (!current || !oldest || oldest === current) throw new Error("Growth needs two versions");
    const rows = getFeatureRows(oldest, current);
    const differing = [...rows.credit, ...rows.capacity, ...rows.boolean]
      .filter((row) => row.differsFromCurrent)
      .map((row) => row.feature.code);
    expect(differing.length).toBeGreaterThan(0);
    for (const code of differing) {
      const row = [...rows.credit, ...rows.capacity, ...rows.boolean].find((entry) => entry.feature.code === code);
      expect(row?.value).not.toEqual(row?.currentValue);
    }
  });

  it("treats a feature absent from the viewed version as not included", () => {
    const edited = cloneCatalog();
    const growth = getPlan("growth", edited);
    growth.releases[0].features = growth.releases[0].features.filter((feature) => feature.code !== "ai_generation");
    const { timeline } = detailOf("growth", edited);
    const rows = getFeatureRows(timeline[0], timeline.at(-1));
    expect(rows.credit.find((row) => row.feature.code === "ai_generation")?.value).toEqual({ kind: "not_included" });
  });
});
