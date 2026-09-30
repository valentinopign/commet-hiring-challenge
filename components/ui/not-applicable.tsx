/**
 * An empty value in a card. The dash is visual only; screen readers hear "Not applicable",
 * because a bare "—" is read as nothing or as "em dash".
 */
export function NotApplicable() {
  return (
    <span className="text-ink-muted">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not applicable</span>
    </span>
  );
}
