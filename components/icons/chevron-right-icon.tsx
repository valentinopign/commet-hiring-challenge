type ChevronRightIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function ChevronRightIcon({ className }: ChevronRightIconProps) {
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
      <path d="m6 3.5 4.5 4.5L6 12.5" />
    </svg>
  );
}
