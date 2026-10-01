import { describe, expect, it } from "vitest";
import { handoffTransform } from "./handoff-geometry";

describe("setup handoff geometry", () => {
  it("preserves the physical position and onboarding's 125% scale", () => {
    expect(handoffTransform({ left: 700, top: 300, width: 500, height: 625 }, 400, 500)).toBe("translate(700px, 300px) scale(1.25, 1.25)");
  });
  it("expands toward the visible sheet, not the entire scrollable page", () => {
    expect(handoffTransform({ left: 240, top: 56, width: 1200, height: 2000 }, 400, 500, 856)).toBe("translate(240px, 56px) scale(3, 1.6)");
  });
  it("keeps finite dimensions for a collapsed or offscreen preview", () => {
    expect(handoffTransform({ left: 0, top: 900, width: 400, height: 0 }, 0, 0, 800)).toBe("translate(0px, 900px) scale(400, 1)");
  });
});
