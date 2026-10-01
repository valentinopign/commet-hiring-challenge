/** Retain the company path while replacing comparison with current-version editing. */
export function planEditHref(href: string, currentVersion: number, animate: boolean): string {
  const url = new URL(href);
  for (const key of ["compare", "diff", "migrate"]) url.searchParams.delete(key);
  url.hash = "";
  url.searchParams.set("version", String(currentVersion));
  url.searchParams.set("edit", animate ? "1" : "instant");
  return `${url.pathname}${url.search}`;
}
