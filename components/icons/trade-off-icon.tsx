type TradeOffIconProps = { className?: string };

/** Decorative: always rendered next to text that carries the same meaning. */
export function TradeOffIcon({ className }: TradeOffIconProps) {
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
      <path d="M3 5.5h10M10.5 3 13 5.5 10.5 8M13 10.5H3M5.5 8 3 10.5 5.5 13" />
    </svg>
  );
}
