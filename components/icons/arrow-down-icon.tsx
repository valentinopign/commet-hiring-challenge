type ArrowDownIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function ArrowDownIcon({ className }: ArrowDownIconProps) {
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
      <path d="M8 3v10M4 9l4 4 4-4" />
    </svg>
  );
}
