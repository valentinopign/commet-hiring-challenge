import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PublishConfirmation } from "@/components/create-plan/publish-confirmation";

const route = vi.hoisted(() => ({ pathname: "/plans/new" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

describe("saved plan confirmation", () => {
  it.each(["/plans/new", "/organizations/org_local/plans/new"])("shows saved status and correctly scoped actions from %s", (pathname) => {
    route.pathname = pathname;
    const html = renderToStaticMarkup(<PublishConfirmation planName="Fresh plan" planCode="fresh" persistence="local" entries={[]}
      positionText="Your plan is now part of this company’s pricing." currency="USD" onCreateAnother={vi.fn()} />);
    const prefix = pathname.startsWith("/organizations/") ? "/organizations/org_local" : "";
    expect(html).toContain("Plan created");
    expect(html).toContain("Fresh plan v1");
    expect(html).toContain("saved in this browser");
    expect(html).toContain(`href="${prefix}/plans/fresh"`);
    expect(html).toContain(`href="${prefix || "/"}"`);
    expect(html).toContain("View plan");
    expect(html).toContain("Back to overview");
    expect(html).toContain("Create another plan");
    expect(html).not.toContain("Nothing was saved");
    expect(html).not.toContain("simulated");
  });
  it("explains session-only publication when storage is unavailable", () => {
    route.pathname = "/plans/new";
    const html = renderToStaticMarkup(<PublishConfirmation planName="Fresh plan" planCode="fresh" persistence="memory" entries={[]}
      positionText="Plan created." currency="USD" onCreateAnother={vi.fn()} />);
    expect(html).toContain("Browser storage is unavailable");
    expect(html).toContain("only lasts for this session");
    expect(html).not.toContain("saved in this browser");
  });
});
