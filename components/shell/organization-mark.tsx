type OrganizationMarkProps = { organizationName: string };

/** The organisation's name and mark. A `<span>`, because it sits inside the switcher's button. */
export function OrganizationMark({ organizationName }: OrganizationMarkProps) {
  return (
    <span className="flex min-w-0 items-center gap-2.5 text-base font-semibold">
      <span aria-hidden="true" className="size-6 shrink-0 rounded-full bg-linear-135 from-org-from to-org-to" />
      {/* On a phone the page title needs the room; the gradient mark still says whose dashboard this is. */}
      <span className="sr-only truncate sm:not-sr-only">{organizationName}</span>
    </span>
  );
}
