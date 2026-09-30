import { describe, expect, it } from "vitest";
import { getPageTitle } from "@/lib/page-titles";

const planNames = { growth: "Growth", free: "Free" };

describe("getPageTitle", () => {
  it("names the fixed routes", () => {
    expect(getPageTitle("/", planNames)).toBe("Overview");
    expect(getPageTitle("/credit-packs", planNames)).toBe("Credit packs");
    expect(getPageTitle("/plans/new", planNames)).toBe("New plan");
  });

  it("uses the plan name on a plan page", () => {
    expect(getPageTitle("/plans/growth", planNames)).toBe("Growth");
  });

  it("ignores a trailing slash", () => {
    expect(getPageTitle("/credit-packs/", planNames)).toBe("Credit packs");
    expect(getPageTitle("/plans/free/", planNames)).toBe("Free");
  });

  it("returns null for unknown plans and routes", () => {
    expect(getPageTitle("/plans/nope", planNames)).toBeNull();
    expect(getPageTitle("/plans/growth/extra", planNames)).toBeNull();
    expect(getPageTitle("/settings", planNames)).toBeNull();
  });
});
