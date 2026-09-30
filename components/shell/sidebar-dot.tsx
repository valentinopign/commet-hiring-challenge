/**
 * Marker for items inside a sidebar group. It sits in a 16px slot, the width of the icons on
 * top-level links, so labels line up. The link it lives in is `group/link`: when that link is the
 * current page the dot grows and takes the ink colour, echoing the link's own highlight.
 */
export function SidebarDot() {
  return (
    <span aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center">
      <span className="size-1 rounded-full bg-ink-muted/70 group-aria-[current=page]/link:size-1.5 group-aria-[current=page]/link:bg-ink" />
    </span>
  );
}
