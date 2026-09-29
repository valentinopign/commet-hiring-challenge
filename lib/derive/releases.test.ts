import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { diffFeatureSets, getVersionTimeline, resolveReleaseFeatures } from "@/lib/derive/releases";
import { cloneCatalog, getPlan, getRelease } from "@/lib/derive/test-helpers";

function resolve(code: string, version: number) {
  return resolveReleaseFeatures(catalog.features, getRelease(code, version).features);
}

function summarize(changes: ReturnType<typeof diffFeatureSets>) {
  return changes.map(({ feature, kind, impact }) => `${feature.code}:${kind}:${impact}`);
}

describe("resolveReleaseFeatures", () => {
  it("returns every catalog feature in catalog order", () => {
    const resolved = resolve("growth", 3);
    expect(resolved.map((entry) => entry.feature.code)).toEqual(
      catalog.features.map((feature) => feature.code),
    );
  });

  it("marks a credit feature missing from the release as not included", () => {
    const videoRender = resolve("free", 1).find((entry) => entry.feature.code === "video_render");
    expect(videoRender?.value).toEqual({ kind: "not_included" });
  });
});

describe("diffFeatureSets", () => {
  it("finds what Growth v3 changed from v2", () => {
    const changes = diffFeatureSets(resolve("growth", 2), resolve("growth", 3));
    expect(summarize(changes)).toEqual([
      "ai_generation:changed:better",
      "sso:added:better",
      "data_export:added:better",
    ]);
    expect(changes[0]).toMatchObject({
      before: { kind: "credit", creditsPerUnit: 6 },
      after: { kind: "credit", creditsPerUnit: 5 },
    });
  });

  it("reports a credit feature appearing in a release as added", () => {
    const changes = diffFeatureSets(resolve("growth", 1), resolve("growth", 2));
    expect(summarize(changes)).toEqual([
      "video_render:added:better",
      "storage_gb:changed:better",
      "workspaces:changed:better",
      "audit_log:added:better",
    ]);
  });

  it("reports losing a feature as removed and worse", () => {
    const changes = diffFeatureSets(resolve("growth", 3), resolve("growth", 1));
    expect(summarize(changes)).toContain("video_render:removed:worse");
    expect(summarize(changes)).toContain("sso:removed:worse");
    expect(summarize(changes)).toContain("ai_generation:changed:worse");
  });

  it("returns nothing for identical releases", () => {
    expect(diffFeatureSets(resolve("scale", 2), resolve("scale", 2))).toEqual([]);
  });
});

describe("getVersionTimeline", () => {
  it("orders versions oldest first with shares and diffs", () => {
    const timeline = getVersionTimeline(catalog, getPlan("growth"));
    expect(timeline.map((entry) => entry.version)).toEqual([1, 2, 3]);
    expect(timeline.map((entry) => entry.subscriptions)).toEqual([12, 340, 46]);
    expect(timeline.reduce((total, entry) => total + entry.percent, 0)).toBe(100);
    expect(timeline[0].changesFromPrevious).toBeNull();
    expect(timeline[2].changesFromPrevious).toHaveLength(3);
    expect(timeline[2].isCurrent).toBe(true);
  });

  it("closes each version with the next version's publish date", () => {
    const timeline = getVersionTimeline(catalog, getPlan("growth"));
    expect(timeline[1].replacedAt).toBe(getRelease("growth", 3).publishedAt);
    expect(timeline[2].replacedAt).toBeNull();
  });

  it("handles a plan with a single version", () => {
    const timeline = getVersionTimeline(catalog, getPlan("enterprise"));
    expect(timeline).toHaveLength(1);
    expect(timeline[0].changesFromPrevious).toBeNull();
    expect(timeline[0].percent).toBe(100);
  });

  it("does not let a draft version close the published one", () => {
    const edited = cloneCatalog();
    const enterprise = getPlan("enterprise", edited);
    enterprise.releases.push({
      version: 2,
      status: "building",
      publishedAt: "2026-09-01T00:00:00Z",
      features: [],
    });
    const timeline = getVersionTimeline(edited, enterprise);
    expect(timeline[0].replacedAt).toBeNull();
    expect(timeline[1]).toMatchObject({ subscriptions: 0, share: 0, percent: 0 });
  });
});
