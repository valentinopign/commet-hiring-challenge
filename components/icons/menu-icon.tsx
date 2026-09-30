type MenuIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function MenuIcon({ className }: MenuIconProps) {
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
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
    </svg>
  );
}
