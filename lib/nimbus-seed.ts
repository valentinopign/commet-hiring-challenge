import { catalog } from "@/data/catalog";

/** Bump when the supplied Nimbus catalog changes; local companies keep their own data. */
export const NIMBUS_SEED_VERSION = 1;
export const NIMBUS_ORGANIZATION_ID = catalog.organization.id;
export const nimbusSeed = catalog;
