type WarningIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function WarningIcon({ className }: WarningIconProps) {
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
      <path d="M8 2.5 14 13H2L8 2.5Z" />
      <path d="M8 6.5v3" />
      <path d="M8 11.5h.01" />
    </svg>
  );
}
