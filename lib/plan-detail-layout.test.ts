import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { catalog } from "@/data/catalog";
import { getPlanDetail } from "@/lib/derive/plan-detail";
import { CatalogPlanDetail } from "@/components/plan-detail/catalog-plan-detail";
import { VersionSwitcher } from "@/components/plan-detail/version-switcher";

vi.mock("@/components/organizations/catalog-link", () => ({
  default: ({ href, children, scroll: _scroll, ...props }: { href: string | { pathname: string; query: Record<string, string | number> }; children: ReactNode; scroll?: boolean }) => {
    const target = typeof href === "string" ? href : `${href.pathname}?${new URLSearchParams(Object.entries(href.query).map(([key, value]) => [key, String(value)]))}`;
    return createElement("a", { ...props, href: target }, children);
  },
}));

function detailOf(code: string) {
  const detail = getPlanDetail(catalog, code);
  if (!detail) throw new Error(`Missing fixture: ${code}`);
  return detail;
}

describe("plan detail layout", () => {
  it("orders pricing, feature configuration, then version history", () => {
    const html = renderToStaticMarkup(createElement(CatalogPlanDetail, { catalog, detail: detailOf("starter"), version: undefined }));
    expect(html.indexOf('id="pricing-heading"')).toBeLessThan(html.indexOf('id="features-heading"'));
    expect(html.indexOf('id="features-heading"')).toBeLessThan(html.indexOf('id="versions-heading"'));
    const pricing = html.slice(0, html.indexOf('id="features-heading"'));
    expect(pricing).toContain("bg-retired-stripes");
    expect(pricing).toContain("v1 15%");
    expect(pricing).toContain("v2 85%");
    expect(pricing).toContain('id="pricing-heading" class="sr-only">Pricing');
    expect(pricing).toContain('id="pricing" aria-labelledby="pricing-heading" class="mt-4"');
    expect(pricing).toMatch(/class="sr-only"><p[^>]*>.*?Price, included credits/);
  });
  it("labels version links clearly and marks the requested version", () => {
    const html = renderToStaticMarkup(createElement(VersionSwitcher, { planCode: "starter", timeline: detailOf("starter").timeline, viewedVersion: 1 }));
    expect(html).toContain("View version");
    expect(html).toContain("min-h-11");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/plans/starter?version=1">v1');
    expect(html).toContain("border-live bg-live-soft");
    expect(html).toContain("Current");
  });
  it("omits the version control when there is nothing to switch", () => {
    expect(renderToStaticMarkup(createElement(VersionSwitcher, { planCode: "free", timeline: detailOf("free").timeline, viewedVersion: 1 }))).toBe("");
  });
});
