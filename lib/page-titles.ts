/**
 * The title the top bar shows for a route. Plan names come in as a plain object because the
 * top bar is a client component and a Map does not cross the server/client boundary.
 * `null` means the route has no title of its own (an unknown plan code, a 404).
 */
export function getPageTitle(pathname: string, planNames: Record<string, string>): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/") return "Overview";
  if (path === "/credit-packs") return "Credit packs";
  if (path === "/plans/new") return "New plan";

  const planMatch = /^\/plans\/([^/]+)$/.exec(path);
  if (planMatch) return planNames[planMatch[1]] ?? null;
  return null;
}
