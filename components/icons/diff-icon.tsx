type DiffIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function DiffIcon({ className }: DiffIconProps) {
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
      <circle cx="4.5" cy="4" r="1.75" />
      <circle cx="11.5" cy="12" r="1.75" />
      <path d="M4.5 5.75V10a2 2 0 0 0 2 2h3.25M11.5 10.25V6a2 2 0 0 0-2-2H6.25" />
    </svg>
  );
}
