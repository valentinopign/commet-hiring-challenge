type ArrowUpRightIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function ArrowUpRightIcon({ className }: ArrowUpRightIconProps) {
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
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}
