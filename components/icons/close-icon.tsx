type CloseIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function CloseIcon({ className }: CloseIconProps) {
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
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
