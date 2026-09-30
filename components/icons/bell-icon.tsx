type BellIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function BellIcon({ className }: BellIconProps) {
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
      <path d="M4 11.5V7a4 4 0 0 1 8 0v4.5l1 1H3l1-1Z" />
      <path d="M6.5 14h3" />
    </svg>
  );
}
