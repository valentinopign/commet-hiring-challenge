import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

describe("shared desktop interface scale", () => {
  it("uses one desktop-only root scale for dashboard and onboarding", () => {
    expect(stylesheet).toMatch(/@media \(min-width: 80rem\)\s*\{\s*html\s*\{[^}]*font-size: 112\.5%;/);
  });
  it("does not stack onboarding CSS zoom on top of the shared scale", () => {
    expect(stylesheet).not.toMatch(/\bzoom\s*:/);
    expect(stylesheet).not.toContain("100dvh / var(--onboarding-scale)");
    expect(stylesheet).not.toContain("--onboarding-scale: 1.25");
  });
});
