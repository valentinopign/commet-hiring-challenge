type SidebarOrganizationProps = { organizationName: string };

/** Plain text on purpose: there is no organisation switcher behind it. */
export function SidebarOrganization({ organizationName }: SidebarOrganizationProps) {
  return (
    <p className="flex h-12 items-center gap-2 px-2 font-semibold">
      <span
        aria-hidden="true"
        className="inline-flex size-6 items-center justify-center rounded-sm bg-ink text-xs text-surface"
      >
        {organizationName.charAt(0)}
      </span>
      {organizationName}
    </p>
  );
}
