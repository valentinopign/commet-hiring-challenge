/** Allow incomplete edits while requiring complete groups before a comma or decimal. */
export function isAllowedAmountInput(text: string, kind: "money" | "count"): boolean {
  const integer = String.raw`(?:\d*|\d{1,3}(?:,\d{3})*,\d{0,3})`;
  const completeInteger = String.raw`(?:\d*|\d{1,3}(?:,\d{3})+)`;
  return new RegExp(kind === "money"
    ? `^(?:${integer}|${completeInteger}\\.\\d{0,2})$`
    : `^${integer}$`).test(text);
}
