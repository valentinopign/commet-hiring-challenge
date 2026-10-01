/** Allow unfinished numeric edits, but never letters, signs or scientific notation. */
export function isAllowedAmountInput(text: string, kind: "money" | "count"): boolean {
  return kind === "money" ? /^\d*(\.\d{0,2})?$/.test(text) : /^\d*$/.test(text);
}
