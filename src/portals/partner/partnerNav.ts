import type { NavGroup } from "@/portals/admin/adminNav";

/** Navigation partenaire — pas de RBAC granulaire en V1 (scope owner implicite) */
export const PARTNER_NAV: NavGroup[] = [
  {
    group: "MA FLOTTE",
    items: [
      {
        label: "Tableau de bord",
        path: "/partner/dashboard",
        permission: "ops.dashboard.view",
      },
      {
        label: "Véhicules",
        path: "/partner/fleet",
        permission: "fleet.drivers.view",
      },
      {
        label: "Véhicules à valider",
        path: "/partner/fleet/pending",
        permission: "fleet.drivers.view",
      },
      {
        label: "Chauffeurs",
        path: "/partner/drivers",
        permission: "fleet.drivers.view",
      },
      {
        label: "Chauffeurs KYC",
        path: "/partner/drivers/pending",
        permission: "fleet.drivers.view",
      },
    ],
  },
  {
    group: "ACTIVITÉ",
    items: [
      {
        label: "Réservations",
        path: "/partner/bookings",
        permission: "ops.trips.view",
      },
      {
        label: "Nouvelle réservation",
        path: "/partner/bookings/new",
        permission: "ops.trips.view",
      },
      {
        label: "Portefeuille",
        path: "/partner/wallet",
        permission: "finance.wallets.view",
      },
    ],
  },
  {
    group: "COMPTE",
    items: [
      {
        label: "Mon profil",
        path: "/partner/profile",
        permission: "ops.dashboard.view",
      },
    ],
  },
];
