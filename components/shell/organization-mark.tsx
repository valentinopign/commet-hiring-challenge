type OrganizationMarkProps = { organizationName: string };

/** Plain text on purpose: there is no organisation switcher behind it, so no chevron either. */
export function OrganizationMark({ organizationName }: OrganizationMarkProps) {
  return (
    <p className="flex min-w-0 items-center gap-2 font-medium">
      <span aria-hidden="true" className="size-5 shrink-0 rounded-full bg-linear-135 from-org-from to-org-to" />
      {/* On a phone the page title needs the room; the gradient mark still says whose dashboard this is. */}
      <span className="sr-only truncate sm:not-sr-only">{organizationName}</span>
    </p>
  );
}
