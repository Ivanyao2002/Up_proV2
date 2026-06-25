/**
 * Mappe un pathname du portail partenaire vers le module métier requis
 * (`fleet`/VTC, `freight`, `rental`). `null` = route commune (accessible à
 * tous les partenaires : dashboard, portefeuille, support, profil…).
 *
 * Utilisé pour le gating centralisé dans `PartnerShell`. L'ordre compte :
 * les préfixes `rental`/`freight` doivent primer sur `fleet` (ex.
 * `/partner/rental/fleet` est du module `rental`, pas `fleet`).
 */
export type PartnerModule = "fleet" | "freight" | "rental";

const ROUTE_MODULE_RULES: { prefix: string; module: PartnerModule }[] = [
  // Location (doit primer sur les règles fleet ci-dessous)
  { prefix: "/partner/rental", module: "rental" },
  // Fret
  { prefix: "/partner/freight", module: "freight" },
  // VTC (FLEET)
  { prefix: "/partner/fleet", module: "fleet" },
  { prefix: "/partner/drivers", module: "fleet" },
  { prefix: "/partner/orders", module: "fleet" },
  { prefix: "/partner/bookings", module: "fleet" },
  { prefix: "/partner/map", module: "fleet" },
  { prefix: "/partner/performance", module: "fleet" },
  { prefix: "/partner/shifts", module: "fleet" },
  { prefix: "/partner/reports", module: "fleet" },
  { prefix: "/partner/gps-devices", module: "fleet" },
  { prefix: "/partner/tracking", module: "fleet" },
  { prefix: "/partner/safety", module: "fleet" },
  { prefix: "/partner/wallet/driver-transfers", module: "fleet" },
  { prefix: "/partner/support/conversations", module: "fleet" },
];

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function partnerRouteModule(pathname: string): PartnerModule | null {
  for (const rule of ROUTE_MODULE_RULES) {
    if (matches(pathname, rule.prefix)) return rule.module;
  }
  return null;
}
