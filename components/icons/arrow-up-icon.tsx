type ArrowUpIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function ArrowUpIcon({ className }: ArrowUpIconProps) {
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
      <path d="M8 13V3M4 7l4-4 4 4" />
    </svg>
  );
}
