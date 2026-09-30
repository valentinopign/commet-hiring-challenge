type OverviewIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function OverviewIcon({ className }: OverviewIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className ?? "size-4 shrink-0"}
    >
      {/* A dashboard of mixed widgets: tall panels and squares in opposite corners. */}
      <rect x="3" y="2.5" width="4" height="5.5" rx="1" />
      <rect x="3" y="9.5" width="4" height="4" rx="1" />
      <rect x="9" y="2.5" width="4" height="4" rx="1" />
      <rect x="9" y="8" width="4" height="5.5" rx="1" />
    </svg>
  );
}
