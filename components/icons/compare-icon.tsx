/** Opposing branches: decorative beside the Compare label. */
export function CompareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className ?? "size-4 shrink-0"}>
      <circle cx="3" cy="4" r="1.75" fill="currentColor" stroke="none" />
      <circle cx="13" cy="12" r="1.75" fill="currentColor" stroke="none" />
      <path d="M3 6v4a2 2 0 0 0 2 2h4m-2-2 2 2-2 2M13 10V6a2 2 0 0 0-2-2H7m2-2L7 4l2 2" />
    </svg>
  );
}
