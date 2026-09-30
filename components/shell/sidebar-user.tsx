import { Avatar } from "@/components/shell/avatar";

type SidebarUserProps = { name: string; initials: string };

/** Who is signed in. Plain text on purpose: there is no account menu behind it. */
export function SidebarUser({ name, initials }: SidebarUserProps) {
  return (
    <p className="flex items-center gap-2 border-t border-line px-2 pt-3 text-ink-muted">
      <Avatar initials={initials} />
      <span className="truncate">{name}</span>
    </p>
  );
}
