type ArchiveIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function ArchiveIcon({ className }: ArchiveIconProps) {
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
      <rect x="2" y="2.5" width="12" height="3" rx="1" />
      <path d="M3 5.5v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7M6.5 8.5h3" />
    </svg>
  );
}
