import type { ReactNode } from "react";
import type { ExhaustionPolicy } from "@/lib/catalog";

type PolicyOptionProps = {
  id?: string;
  value: ExhaustionPolicy["type"];
  checked: boolean;
  title: string;
  usedBy?: string[];
  describedBy?: string;
  compact?: boolean;
  onChoose: () => void;
  children?: ReactNode;
};

export function PolicyOption({ id, value, checked, title, usedBy = [], describedBy, compact = false, onChoose, children }: PolicyOptionProps) {
  const names = usedBy.length <= 1 ? usedBy.join("") : `${usedBy.slice(0, -1).join(", ")} and ${usedBy.at(-1)}`;
  return <label className={`flex min-h-11 cursor-pointer gap-3 rounded-card border border-line bg-surface-card ${compact ? "p-2.5" : "p-4"} transition-colors hover:border-line-strong has-checked:border-live has-checked:bg-live-soft`}>
    <input id={id} type="radio" name="exhaustion-policy" value={value} checked={checked} onChange={onChoose} aria-describedby={describedBy} className="mt-0.5 size-4 shrink-0 accent-live" />
    <span className="min-w-0 space-y-1.5">
      <span className="block font-medium">{title}</span>
      {children && <span className="block space-y-1.5 text-ink-muted">{children}</span>}
      {usedBy.length > 0 && <span className="block text-caption text-ink-muted">Today: {names}.</span>}
    </span>
  </label>;
}
