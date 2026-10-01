import { describe, expect, it } from "vitest";
import { organizationPath, parseOrganizationPath, scopeCatalogHref } from "./organization-routes";

describe("organization routes", () => {
  it("encodes IDs and resolves overview and nested catalog paths", () => {
    expect(organizationPath("org one")).toBe("/organizations/org%20one");
    expect(parseOrganizationPath(organizationPath("org one", "/plans/growth"))).toEqual({ id: "org one", pathname: "/plans/growth" });
    expect(parseOrganizationPath("/organizations/org_one")).toEqual({ id: "org_one", pathname: "/" });
  });
  it.each(["/", "/onboarding", "/plans/growth", "/organizations/", "/organizations/%ZZ"])("ignores non-company or malformed routes: %s", (path) => {
    expect(parseOrganizationPath(path)).toBeNull();
  });
  it.each([
    ["/", "/organizations/org_one"],
    ["/plans/new?from=growth&step=price", "/organizations/org_one/plans/new?from=growth&step=price"],
    ["/plans/growth?version=1#features", "/organizations/org_one/plans/growth?version=1#features"],
    ["/credit-packs#packs", "/organizations/org_one/credit-packs#packs"],
  ])("keeps catalog navigation within the current company: %s", (href, expected) => {
    expect(scopeCatalogHref(href, "org_one")).toBe(expected);
    expect(scopeCatalogHref(href, null)).toBe(href);
  });
  it.each(["/onboarding", "/organizations/org_two", "#features", "?version=1", "https://example.com/plans/new", "//example.com/plans", "/plans-other"])("leaves unrelated or already scoped links unchanged: %s", (href) => {
    expect(scopeCatalogHref(href, "org_one")).toBe(href);
  });
});
