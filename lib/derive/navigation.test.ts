import { describe, expect, it } from "vitest";
import { catalog } from "@/data/catalog";
import { getNavigationPlans, getOrganizations } from "@/lib/derive/navigation";

describe("getNavigationPlans", () => {
  it("lists plans cheapest first and flags only those with a pending warning", () => {
    expect(getNavigationPlans(catalog)).toEqual([
      { code: "free", name: "Free", needsAttention: false },
      { code: "starter", name: "Starter", needsAttention: false },
      { code: "growth", name: "Growth", needsAttention: true },
      { code: "scale", name: "Scale", needsAttention: false },
      { code: "enterprise", name: "Enterprise", needsAttention: false },
    ]);
  });
});

describe("getOrganizations", () => {
  it("lists the catalog's organisation", () => {
    expect(getOrganizations(catalog)).toEqual([{ id: "org_9fhq2p", name: "Nimbus" }]);
  });
});
