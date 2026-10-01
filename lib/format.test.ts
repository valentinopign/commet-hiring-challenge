import { describe, expect, it } from "vitest";
import { formatAmountForInput, formatCount, getCurrencySymbol, parseAmount, parseWholeNumber } from "@/lib/format";

describe("amount inputs", () => {
  it("round-trips cents through editable text", () => {
    expect(formatAmountForInput(4900)).toBe("49");
    expect(formatAmountForInput(4950)).toBe("49.50");
    expect(parseAmount(formatAmountForInput(4950))).toBe(4950);
  });

  it("accepts what people type for money", () => {
    expect(parseAmount("49")).toBe(4900);
    expect(parseAmount(" 1,299.5 ")).toBe(129950);
    expect(parseAmount("0.29")).toBe(29);
  });

  it("rejects anything that is not an amount", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("$49")).toBeNull();
    expect(parseAmount("49.999")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
  });

  it("parses whole numbers only", () => {
    expect(parseWholeNumber("12,500")).toBe(12500);
    expect(parseWholeNumber("0")).toBe(0);
    expect(parseWholeNumber("1.5")).toBeNull();
    expect(parseWholeNumber("")).toBeNull();
  });

  it("finds the currency symbol", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
  });
});

describe("formatCount", () => {
  it("uses the singular only for exactly one", () => {
    expect(formatCount(1, "customer")).toBe("1 customer");
    expect(formatCount(0, "customer")).toBe("0 customers");
    expect(formatCount(12500, "customer")).toBe("12,500 customers");
    expect(formatCount(2, "person", "people")).toBe("2 people");
  });
});
