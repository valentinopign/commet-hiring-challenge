type CriticalIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function CriticalIcon({ className }: CriticalIconProps) {
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
      <path d="M5.5 2h5L14 5.5v5L10.5 14h-5L2 10.5v-5L5.5 2Z" />
      <path d="M6 6l4 4M10 6l-4 4" />
    </svg>
  );
}
