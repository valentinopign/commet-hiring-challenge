type AvatarProps = { initials: string };

/** Initials only: there is no user data, so no image. The name next to it is the accessible text. */
export function Avatar({ initials }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-line text-xs font-semibold text-ink"
    >
      {initials}
    </span>
  );
}
