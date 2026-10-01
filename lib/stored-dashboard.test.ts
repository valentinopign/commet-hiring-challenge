import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalog } from "@/data/catalog";
import type { Catalog } from "@/lib/catalog";
import type { DraftPlan } from "@/lib/derive/types";
import { StoredCatalogDashboard } from "@/components/organizations/local-organization-dashboard";
import { createOrganizationStore } from "@/lib/organization-store";
import { createEditState, editPlanReducer } from "@/lib/edit-plan/changes";
import { addOnboardingPlan } from "@/lib/onboarding/add-plan";
import { getCatalogAlerts, needsAttention } from "@/lib/derive/alerts";
import { RouteShell } from "@/components/shell/route-shell";

type FlowProps = { catalog: Catalog; initialBaseCode: string | null; onPublish: (draft: DraftPlan) => void; onCancel: () => void; publicationNote: string };
const route = vi.hoisted(() => ({ pathname: "/", query: "", push: vi.fn() }));
const flow = vi.hoisted(() => ({ props: null as FlowProps | null }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname, useSearchParams: () => new URLSearchParams(route.query), useRouter: () => ({ push: route.push }) }));
vi.mock("next/link", () => ({ default: ({ href, children, scroll: _scroll, prefetch: _prefetch, ...props }: { href: string | { pathname?: string; query?: Record<string, string | number> }; children: ReactNode; scroll?: boolean; prefetch?: boolean }) => {
  const target = typeof href === "string" ? href : `${href.pathname ?? ""}${href.query ? `?${new URLSearchParams(Object.entries(href.query).map(([key, value]) => [key, String(value)]))}` : ""}`;
  return createElement("a", { ...props, href: target }, children);
} }));
vi.mock("@/components/create-plan/create-plan-flow", () => ({ CreatePlanFlow: (props: FlowProps) => { flow.props = props; return createElement("p", {}, props.publicationNote); } }));
vi.mock("@/components/organizations/organization-provider", () => ({ useOrganizations: () => ({ store: activeStore, snapshot: activeStore.getSnapshot() }) }));

const id = catalog.organization.id;
let activeStore = createOrganizationStore({ builtInOrganizationId: id, storage: () => null });
beforeEach(() => {
  activeStore = createOrganizationStore({ builtInOrganizationId: id, storage: () => null });
  route.pathname = "/"; route.query = ""; route.push.mockClear(); flow.props = null;
});
function render(path: string[] = [], organizationId = id) {
  route.pathname = organizationId === id ? `/${path.join("/")}` : `/organizations/${organizationId}${path.length ? `/${path.join("/")}` : ""}`;
  return renderToStaticMarkup(createElement(StoredCatalogDashboard, { organizationId, path }));
}
function growth(value: Catalog) {
  const plan = value.plans.find((entry) => entry.code === "growth");
  if (!plan) throw new Error("Missing fixture");
  return plan;
}
function freshDraft(): DraftPlan { return { ...createEditState(catalog, growth(catalog)).draft, code: "fresh", name: "Fresh plan" }; }

describe("stored catalog dashboard", () => {
  it("renders the complete Nimbus seed before hydration while local companies still wait", () => {
    const html = render();
    expect(html).toContain('id="main"');
    expect(html).toContain('aria-label="Main"');
    expect(html).toContain("Growth");
    expect(html).toContain("Plans");
    expect(html).toContain('href="/plans/growth"');
    expect(html).not.toContain("Loading your company");
    expect(html).not.toContain("Browser storage is unavailable");
    expect(render(["plans", "new"])).not.toContain("Browser storage is unavailable");
    expect(render([], "org_local")).toContain("Loading your company");
  });
  it("feeds restored Nimbus data to overview, navigation, alerts, title, switcher and packs", () => {
    let raw: string | null = null;
    const adapter = { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; }, removeItem: () => { raw = null; } };
    const options = { builtInOrganizationId: id, storage: () => adapter };
    const saved = structuredClone(addOnboardingPlan(catalog, freshDraft(), "2026-10-01T18:00:00Z"));
    saved.organization.name = "Nimbus stored";
    growth(saved).name = "Configured Growth";
    const pricing = growth(saved).pricing;
    if (pricing.type === "standard") pricing.prices.forEach((price) => { if (price.billingInterval === "monthly") price.price = 14900; });
    activeStore = createOrganizationStore(options);
    activeStore.saveCatalog(saved);
    activeStore = createOrganizationStore(options);
    activeStore.hydrate();
    const html = render();
    expect(html).toContain('href="/plans/fresh"');
    expect(html).toContain("Fresh plan");
    expect(html).toContain("Nimbus stored");
    expect(html.replace(/<[^>]*>/g, "")).toContain("$149 / mo");
    const attention = getCatalogAlerts(saved).filter(needsAttention).length;
    expect(html).toContain(`Alerts, ${attention} ${attention === 1 ? "needs" : "need"} attention`);
    const detail = render(["plans", "growth"]);
    expect(detail).toContain('class="truncate">Configured Growth');
    expect(detail).toContain("$149 / mo");
    expect(detail).not.toContain("Simulated publication");
    expect(render(["credit-packs"])).toContain("Fresh plan");
  });
  it("saves new Nimbus plans without navigating away before confirmation, and cancels to the root overview", () => {
    activeStore.hydrate();
    render(["plans", "new"]);
    const props = flow.props;
    if (!props) throw new Error("Missing flow props");
    props.onPublish(freshDraft());
    expect(activeStore.getSnapshot().organizations[0].plans.some((plan) => plan.code === "fresh")).toBe(true);
    expect(route.push).not.toHaveBeenCalled();
    props.onCancel();
    expect(route.push).toHaveBeenLastCalledWith("/");
    route.query = "from=fresh";
    render(["plans", "new"]);
    expect(flow.props?.initialBaseCode).toBe("fresh");
  });
  it("shows zero customers for a new local company without no-customers warnings or bell badges", () => {
    const local = structuredClone(catalog);
    local.organization.id = "org_new_local";
    local.subscriptionsByRelease = [];
    activeStore.saveCatalog(local);
    const html = render([], local.organization.id);
    expect(html).toContain("Alerts, nothing needs attention");
    expect(html).not.toContain("No customers on v");
    expect(html).not.toContain("data-bell-badge");
  });
  it("compares persisted Nimbus releases and prioritizes current editing with pending migrations", () => {
    activeStore.hydrate();
    const original = growth(catalog);
    const state = editPlanReducer(createEditState(catalog, original), { type: "set_feature", code: "ai_generation", feature: { code: "ai_generation", type: "credit", creditsPerUnit: 4 } });
    expect(activeStore.publishEdit(id, { original, state, selectedVersions: [1, 2], scheduledAt: "2026-10-01T18:00:00Z" }).ok).toBe(true);
    route.query = "compare=scale.2";
    expect(render(["plans", "growth"])).toContain("Comparing Growth v4 with Scale v2");
    route.query = "version=1&compare=scale.2&edit=instant";
    const html = render(["plans", "growth"]);
    expect(html).toContain("Editing current v4");
    expect(html).toContain("340 customers scheduled to move to v4 at renewal");
    expect(html).not.toContain("Comparing Growth");
  });
  it("shows newly stored codes and handles missing plans within the client dashboard", () => {
    activeStore.saveCatalog(addOnboardingPlan(catalog, freshDraft(), "2026-10-01T18:00:00Z"));
    expect(render(["plans", "fresh"])).toContain("Create plan from Fresh plan");
    const missing = render(["plans", "missing"]);
    expect(missing).toContain("Page not found");
    expect(missing).toContain('href="/">Back to overview');
  });
  it("renders the reset explanation for Nimbus even without created companies", () => {
    activeStore.hydrate();
    const html = render();
    expect(html).toContain("Restore Nimbus to the original demo");
    expect(html).toContain("clear all scheduled customer moves");
    expect(html).toContain("Your theme stays unchanged");
  });
  it("leaves dashboard composition to routes and only wraps onboarding with main", () => {
    const children = createElement("p", {}, "Route content");
    expect(renderToStaticMarkup(createElement(RouteShell, { children }))).toBe("<p>Route content</p>");
    route.pathname = "/onboarding";
    expect(renderToStaticMarkup(createElement(RouteShell, { children }))).toBe('<main id="main"><p>Route content</p></main>');
  });
});
