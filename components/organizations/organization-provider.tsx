"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createOrganizationStore, type OrganizationStore } from "@/lib/organization-store";
import { parseOrganizationPath } from "@/lib/organization-routes";

const OrganizationContext = createContext<OrganizationStore | null>(null);

export function OrganizationProvider({ builtInOrganizationId, children }: { builtInOrganizationId: string; children: ReactNode }) {
  const [store] = useState(() => createOrganizationStore({ builtInOrganizationId }));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const pathname = usePathname();
  useEffect(() => { store.hydrate(); }, [store]);
  useEffect(() => {
    if (!snapshot.hydrated || pathname.startsWith("/onboarding")) return;
    const requestedId = parseOrganizationPath(pathname)?.id ?? builtInOrganizationId;
    if (requestedId !== store.getSnapshot().activeOrganizationId) store.selectOrganization(requestedId);
  }, [store, pathname, snapshot.hydrated, builtInOrganizationId]);
  return <OrganizationContext value={store}>{children}</OrganizationContext>;
}

export function useOrganizations() {
  const store = useContext(OrganizationContext);
  if (!store) throw new Error("OrganizationProvider is required.");
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return { store, snapshot };
}
