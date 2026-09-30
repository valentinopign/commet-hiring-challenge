import { LockIcon } from "@/components/icons/lock-icon";

type VisibilityBadgeProps = { isPublic: boolean };

/** Only private plans get a badge: public is the norm and would just add noise. */
export function VisibilityBadge({ isPublic }: VisibilityBadgeProps) {
  if (isPublic) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-line-strong px-1.5 py-px text-xs font-medium text-ink-muted">
      <LockIcon className="size-3 shrink-0" />
      Private
    </span>
  );
}
