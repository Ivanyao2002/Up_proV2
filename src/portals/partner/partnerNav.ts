import type { NavGroup } from "@/portals/shared/navTypes";

/** Navigation partenaire — pas de RBAC granulaire en V1 (scope owner implicite) */
export const PARTNER_NAV: NavGroup[] = [
  {
    group: "MA FLOTTE",
    items: [
      {
        label: "Tableau de bord",
        path: "/partner/dashboard",
        icon: "dashboard",
        permission: "ops.dashboard.view",
      },
      {
        label: "Véhicules",
        path: "/partner/fleet",
        icon: "fleet",
        permission: "fleet.drivers.view",
      },
      {
        label: "Véhicules à valider",
        path: "/partner/fleet/pending",
        icon: "fleet-pending",
        permission: "fleet.drivers.view",
      },
      {
        label: "Chauffeurs",
        path: "/partner/drivers",
        icon: "drivers",
        permission: "fleet.drivers.view",
      },
      {
        label: "Chauffeurs KYC",
        path: "/partner/drivers/pending",
        icon: "drivers-pending",
        permission: "fleet.drivers.view",
      },
      {
        label: "Carte live",
        path: "/partner/map",
        icon: "map",
        permission: "ops.map.view",
      },
    ],
  },
  {
    group: "ACTIVITÉ",
    items: [
      {
        label: "Réservations",
        path: "/partner/bookings",
        icon: "bookings",
        permission: "ops.trips.view",
      },
      {
        label: "Nouvelle réservation",
        path: "/partner/bookings/new",
        icon: "booking-new",
        permission: "ops.trips.view",
      },
      {
        label: "Réservations récurrentes",
        path: "/partner/bookings/recurring",
        icon: "recurring",
        permission: "ops.trips.view",
      },
      {
        label: "Planning shifts",
        path: "/partner/shifts",
        icon: "shifts",
        permission: "fleet.drivers.view",
      },
      {
        label: "Rapports",
        path: "/partner/reports",
        icon: "reports",
        permission: "ops.trips.view",
      },
    ],
  },
  {
    group: "FINANCE",
    items: [
      {
        label: "Portefeuille",
        path: "/partner/wallet",
        icon: "wallet",
        permission: "finance.wallets.view",
      },
      {
        label: "Recharges chauffeurs",
        path: "/partner/wallet/driver-transfers",
        icon: "wallet-transfer",
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
        icon: "profile",
        permission: "ops.dashboard.view",
      },
    ],
  },
];
