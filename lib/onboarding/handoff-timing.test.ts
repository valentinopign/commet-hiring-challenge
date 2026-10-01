import { describe, expect, it } from "vitest";
import { getHandoffTiming } from "./handoff-timing";

describe("setup handoff timing", () => {
  it("finishes every staggered layer before revealing the dashboard", () => {
    const timing = getHandoffTiming(false);
    expect(timing.exit).toBeGreaterThanOrEqual(timing.layer + 5 * timing.stagger);
    expect(timing.exit).toBe(timing.background + timing.backgroundStagger);
    expect(timing.background).toBe(1600);
    expect(timing.backgroundStagger).toBe(120);
  });
  it("uses only a short undelayed fade for reduced motion", () => {
    const timing = getHandoffTiming(true);
    expect(timing.layer).toBe(0);
    expect(timing.stagger).toBe(0);
    expect(timing.exit).toBe(0);
    expect(timing.background).toBe(0);
    expect(timing.reveal).toBe(200);
  });
});
