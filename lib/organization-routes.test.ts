import { describe, expect, it } from "vitest";
import { organizationPath, parseOrganizationPath, scopeCatalogHref } from "./organization-routes";
import { NIMBUS_ORGANIZATION_ID } from "./nimbus-seed";

describe("organization routes", () => {
  it("keeps Nimbus at root paths, including comparison and creation queries", () => {
    expect(organizationPath(NIMBUS_ORGANIZATION_ID)).toBe("/");
    expect(organizationPath(NIMBUS_ORGANIZATION_ID, "/plans/growth")).toBe("/plans/growth");
    expect(scopeCatalogHref("/plans/growth?compare=scale.2&diff=1#features", NIMBUS_ORGANIZATION_ID)).toBe("/plans/growth?compare=scale.2&diff=1#features");
    expect(scopeCatalogHref("/plans/new?from=growth", NIMBUS_ORGANIZATION_ID)).toBe("/plans/new?from=growth");
  });
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
