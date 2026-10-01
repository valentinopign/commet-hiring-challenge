/** The URL identifies a local catalog without asking the server to read browser storage. */
export function organizationPath(id: string, pathname = "/"): string {
  return `/organizations/${encodeURIComponent(id)}${pathname === "/" ? "" : pathname}`;
}

export function parseOrganizationPath(pathname: string): { id: string; pathname: string } | null {
  const match = /^\/organizations\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!match) return null;
  try { return { id: decodeURIComponent(match[1]), pathname: match[2] || "/" }; }
  catch { return null; }
}

export function scopeCatalogHref(href: string, id: string | null): string {
  if (!id) return href;
  const split = href.search(/[?#]/);
  const pathname = split === -1 ? href : href.slice(0, split);
  const suffix = split === -1 ? "" : href.slice(split);
  if (pathname !== "/" && !/^\/(plans(?:\/.*)?|credit-packs)\/?$/.test(pathname)) return href;
  return organizationPath(id, pathname) + suffix;
}
