"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { parseOrganizationPath, scopeCatalogHref } from "@/lib/organization-routes";

/** Keep existing catalog links reusable on Nimbus and on a browser-owned company. */
export default function CatalogLink({ href, ...props }: ComponentProps<typeof Link>) {
  const id = parseOrganizationPath(usePathname())?.id ?? null;
  const scoped = typeof href === "string" ? scopeCatalogHref(href, id)
    : { ...href, pathname: href.pathname ? scopeCatalogHref(href.pathname, id) : href.pathname };
  return <Link {...props} href={scoped} />;
}
