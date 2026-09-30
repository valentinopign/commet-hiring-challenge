type UsersIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function UsersIcon({ className }: UsersIconProps) {
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
      <circle cx="6" cy="5.5" r="2.5" />
      <path d="M1.5 13.5a4.5 4.5 0 0 1 9 0" />
      <path d="M10.5 3.2a2.5 2.5 0 0 1 0 4.6M12 9.3a4.5 4.5 0 0 1 2.5 4.2" />
    </svg>
  );
}
