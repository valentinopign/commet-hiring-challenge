import { describe, expect, it } from "vitest";
import { getHandoffTiming } from "./handoff-timing";

describe("setup handoff timing", () => {
  it("keeps the real dashboard covered until expansion is finished", () => {
    const timing = getHandoffTiming(false);
    expect(timing.revealDelay).toBeGreaterThanOrEqual(timing.expansion);
    expect(timing.previewDelay + timing.previewFade).toBeLessThan(timing.expansion);
    expect(timing.cover + timing.revealDelay + timing.reveal).toBe(1500);
  });
  it("uses only a short undelayed fade for reduced motion", () => {
    const timing = getHandoffTiming(true);
    expect(timing.cover).toBe(0);
    expect(timing.expansion).toBe(0);
    expect(timing.revealDelay).toBe(0);
    expect(timing.reveal).toBe(200);
  });
});
