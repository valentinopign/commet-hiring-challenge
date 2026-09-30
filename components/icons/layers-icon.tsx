type LayersIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function LayersIcon({ className }: LayersIconProps) {
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
      <path d="M8 2 14 5 8 8 2 5 8 2Z" />
      <path d="M2 8l6 3 6-3M2 11l6 3 6-3" />
    </svg>
  );
}
