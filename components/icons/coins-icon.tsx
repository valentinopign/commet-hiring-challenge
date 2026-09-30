type CoinsIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function CoinsIcon({ className }: CoinsIconProps) {
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
      <ellipse cx="6.5" cy="5" rx="4" ry="2" />
      <path d="M2.5 5v3c0 1.1 1.8 2 4 2s4-.9 4-2V5" />
      <path d="M6.5 10v1c0 1.1 1.8 2 4 2s4-.9 4-2V8c0-1-1.5-1.8-3.5-2" />
    </svg>
  );
}
