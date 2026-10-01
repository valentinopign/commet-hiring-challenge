import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalOrganizationContent } from "@/components/organizations/local-organization-content";
import { catalog } from "@/data/catalog";

const route = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams(route.query) }));
vi.mock("@/components/organizations/organization-provider", () => ({ useOrganizations: () => ({
  store: { publishEdit: vi.fn() },
  snapshot: { scheduledMigrations: [{ organizationId: "local-id", planCode: "growth", fromVersion: 1, toVersion: 3, customers: 12, scheduledAt: "2026-10-01T12:00:00Z" }] },
}) }));
vi.mock("@/components/organizations/catalog-link", () => ({ default: ({ children, href: _href, scroll: _scroll, ...props }: { children: ReactNode; href: unknown; scroll?: boolean }) => createElement("a", props, children) }));
afterEach(() => { route.query = ""; });

const localCatalog = { ...catalog, organization: { ...catalog.organization, id: "local-id", name: "Local company" } };
const render = () => renderToStaticMarkup(createElement(LocalOrganizationContent, { catalog: localCatalog, path: ["plans", "growth"] }));

describe("local organization detail modes", () => {
  it("wires comparison and difference filtering to the hydrated catalog", () => {
    route.query = "version=1&compare=scale.2&diff=1";
    const html = render();
    expect(html).toContain("Comparing Growth v1 with Scale v2");
    expect(html).toContain("Only differences: on, show all features");
    expect(html).toContain('id="edit-plan-action"');
    expect(html).not.toContain("Plan edit actions");
  });
  it("gives current editing priority and retains persisted pending migration context", () => {
    route.query = "version=1&compare=scale.2&edit=instant";
    const html = render();
    expect(html).toContain("Editing current v3");
    expect(html).toContain('id="monthly-price"');
    expect(html).toContain("Configure migration");
    expect(html).toContain("12 customers scheduled to move to v3 at renewal");
    expect(html).not.toContain("Comparing Growth");
    expect(html).not.toContain("Comparison unavailable");
  });
});
