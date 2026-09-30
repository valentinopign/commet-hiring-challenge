type InfoIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function InfoIcon({ className }: InfoIconProps) {
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
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.5v3.5" />
      <path d="M8 5h.01" />
    </svg>
  );
}
