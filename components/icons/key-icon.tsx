type KeyIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function KeyIcon({ className }: KeyIconProps) {
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
      <circle cx="5.5" cy="10.5" r="3" />
      <path d="M7.6 8.4 13.5 2.5M11.5 4.5l1.5 1.5M10 6l1.25 1.25" />
    </svg>
  );
}
