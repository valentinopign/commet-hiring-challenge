import { describe, expect, it } from "vitest";
import { isAllowedAmountInput } from "./amount-input";

describe("isAllowedAmountInput", () => {
  it.each(["", "0", "123", "12500"])("allows whole numeric edits: %s", (text) => {
    expect(isAllowedAmountInput(text, "count")).toBe(true);
    expect(isAllowedAmountInput(text, "money")).toBe(true);
  });
  it.each([".", "49.", "49.5", "49.50", ".25"])("allows unfinished/decimal money but not counts: %s", (text) => {
    expect(isAllowedAmountInput(text, "money")).toBe(true);
    expect(isAllowedAmountInput(text, "count")).toBe(false);
  });
  it.each(["abc", "12abc", "1e3", "-5", "+5", "$49", "12 34", "1,000", "49.999", "1.2.3"])("rejects non-numeric typing or paste: %s", (text) => {
    expect(isAllowedAmountInput(text, "count")).toBe(false);
    expect(isAllowedAmountInput(text, "money")).toBe(false);
  });
});
