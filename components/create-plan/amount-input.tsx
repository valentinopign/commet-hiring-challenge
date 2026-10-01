"use client";

import { useState } from "react";
import type { ControlProps } from "@/components/create-plan/form-field";
import { inputClass } from "@/components/ui/control-styles";
import { formatAmountForInput, parseAmount, parseWholeNumber } from "@/lib/format";
import { isAllowedAmountInput } from "@/lib/create-plan/amount-input";

type AmountInputProps = ControlProps & {
  /** `money` edits cents as dollars; `count` edits a whole number such as credits or seats. */
  kind: "money" | "count";
  value: number | null;
  /** `null` when the field is empty or does not hold a valid number yet. */
  onValueChange: (value: number | null) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
};

function toText(kind: AmountInputProps["kind"], value: number | null): string {
  if (value === null) return "";
  return kind === "money" ? formatAmountForInput(value) : String(value);
}

/**
 * Keeps unfinished numeric edits ("49.") while the draft only ever receives a parsed number
 * or `null`. When the value changes from outside (a suggestion applied), the text follows.
 */
export function AmountInput({ kind, value, onValueChange, prefix, suffix, placeholder, ...control }: AmountInputProps) {
  const parse = kind === "money" ? parseAmount : parseWholeNumber;
  const [text, setText] = useState(() => toText(kind, value));
  const [syncedValue, setSyncedValue] = useState(value);
  // Adjusting state while rendering: an outside change rewrites the text, the person's own typing does not.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value !== parse(text)) setText(toText(kind, value));
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        {prefix && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
            {prefix}
          </span>
        )}
        <input
          {...control}
          type="text"
          inputMode={kind === "money" ? "decimal" : "numeric"}
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          onChange={(event) => {
            const nextText = event.target.value;
            if (!isAllowedAmountInput(nextText, kind)) return;
            const parsed = parse(nextText);
            setText(nextText);
            setSyncedValue(parsed);
            onValueChange(parsed);
          }}
          className={`${inputClass} tabular-nums ${prefix ? "pl-7" : ""}`}
        />
      </div>
      {suffix && <span className="shrink-0 text-ink-muted">{suffix}</span>}
    </div>
  );
}
