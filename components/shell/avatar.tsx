type AvatarProps = { name: string; initials: string };

/**
 * The signed-in person. Initials only, since there is no user data, and not a button, since
 * there is no account menu behind it. The name is exposed as the image's label and as a tooltip.
 */
export function Avatar({ name, initials }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={`Signed in as ${name}`}
      title={name}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised text-xs font-semibold text-ink"
    >
      <span aria-hidden="true">{initials}</span>
    </span>
  );
}
