import { describe, expect, it } from "vitest";
import { isAllowedAmountInput } from "./amount-input";

describe("isAllowedAmountInput", () => {
  it.each(["", "0", "123", "12500"])("allows whole numeric edits: %s", (text) => {
    expect(isAllowedAmountInput(text, "count")).toBe(true);
    expect(isAllowedAmountInput(text, "money")).toBe(true);
  });
  it.each(["1,", "1,2", "1,23", "1,234", "12,500", "1,234,567"])("allows grouped edits: %s", (text) => {
    expect(isAllowedAmountInput(text, "count")).toBe(true);
    expect(isAllowedAmountInput(text, "money")).toBe(true);
  });
  it.each(["1,299.", "1,299.00"])("allows grouped money: %s", (text) => {
    expect(isAllowedAmountInput(text, "money")).toBe(true);
    expect(isAllowedAmountInput(text, "count")).toBe(false);
  });
  it.each([",123", "1234,567", "1,,000", "12,50.00", "1,2345"])("rejects malformed groups: %s", (text) => {
    expect(isAllowedAmountInput(text, "money")).toBe(false);
    expect(isAllowedAmountInput(text, "count")).toBe(false);
  });
  it.each([".", "49.", "49.5", "49.50", ".25"])("allows unfinished/decimal money but not counts: %s", (text) => {
    expect(isAllowedAmountInput(text, "money")).toBe(true);
    expect(isAllowedAmountInput(text, "count")).toBe(false);
  });
  it.each(["abc", "12abc", "1e3", "-5", "+5", "$49", "12 34", "49.999", "1.2.3"])("rejects non-numeric typing or paste: %s", (text) => {
    expect(isAllowedAmountInput(text, "count")).toBe(false);
    expect(isAllowedAmountInput(text, "money")).toBe(false);
  });
});
