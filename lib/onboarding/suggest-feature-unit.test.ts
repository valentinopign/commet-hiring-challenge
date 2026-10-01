import { describe, expect, it } from "vitest";
import { measurementOverride, suggestFeatureUnit } from "./suggest-feature-unit";

describe("measurementOverride", () => {
  it("restores suggestions after deleting an accepted measurement", () => {
    expect(measurementOverride("generation")).toBe("generation");
    const cleared = measurementOverride("");
    expect(cleared).toBeNull();
    expect(cleared ?? suggestFeatureUnit("API calls", "credit")).toBe("call");
  });
  it("treats whitespace as cleared without trimming incomplete manual input", () => {
    expect(measurementOverride("  ")).toBeNull();
    expect(measurementOverride("API call ")).toBe("API call ");
  });
});

describe("suggestFeatureUnit", () => {
  it.each([
    ["Generate an image", "credit", "generation"],
    ["Image generations", "credit", "generation"],
    [" API calls ", "credit", "call"],
    ["Video renders", "credit", "render"],
    ["Users", "capacity", "user"],
    ["Team seats", "capacity", "seat"],
    ["Storage", "capacity", "GB"],
    ["Workspaces", "capacity", "workspace"],
    ["Custom action", "credit", "use"],
    ["Custom capacity", "capacity", "item"],
    ["Priority support", "boolean", ""],
  ] as const)("suggests a measurement for %s", (name, type, expected) => {
    expect(suggestFeatureUnit(name, type)).toBe(expected);
  });
});
