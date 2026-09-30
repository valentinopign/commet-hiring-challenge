type PacksIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function PacksIcon({ className }: PacksIconProps) {
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
      <path d="M8 1.5 14 4.5v7L8 14.5 2 11.5v-7L8 1.5Z" />
      <path d="M2 4.5 8 7.5l6-3" />
      <path d="M8 7.5v7" />
    </svg>
  );
}
