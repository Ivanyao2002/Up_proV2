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
      // {
      //   label: "Véhicules à valider",
      //   path: "/partner/fleet/pending",
      //   icon: "fleet-pending",
      //   permission: "fleet.drivers.view",
      // },
      {
        label: "Chauffeurs",
        path: "/partner/drivers",
        icon: "drivers",
        permission: "fleet.drivers.view",
      },
      // {
      //   label: "Chauffeurs KYC",
      //   path: "/partner/drivers/pending",
      //   icon: "drivers-pending",
      //   permission: "fleet.drivers.view",
      // },
      // {
      //   label: "Réservations",
      //   path: "/partner/bookings",
      //   icon: "trips",
      //   permission: "ops.trips.view",
      // },
      {
        label: "Courses",
        path: "/partner/orders",
        icon: "trips",
        permission: "ops.trips.view",
      },
      {
        label: "Carte live",
        path: "/partner/map",
        icon: "map",
        permission: "ops.map.view",
      },
      {
        label: "Performance",
        path: "/partner/performance",
        icon: "reports",
        permission: "fleet.drivers.view",
      },
      // {
      //   label: "Balises GPS",
      //   path: "/partner/gps-devices",
      //   icon: "map",
      //   permission: "fleet.drivers.view",
      // },
      // {
      //   label: "Sécurité / SOS",
      //   path: "/partner/safety",
      //   icon: "drivers-pending",
      //   permission: "fleet.drivers.view",
      // },
    ],
  },
  {
    group: "OPPORTUNITÉS",
    items: [
      {
        label: "Offres de fret",
        path: "/partner/freight",
        icon: "trips",
        permission: "partner.freight.view",
      },
      {
        label: "Zones & Couloirs",
        path: "/partner/freight/zones",
        icon: "map",
        permission: "partner.freight.view",
      },
      {
        label: "Réservations location",
        path: "/partner/rental",
        icon: "fleet",
        permission: "partner.rental.view",
      },
    ],
  },
  {
    group: "ACTIVITÉ",
    items: [
      {
        label: "Nouvelle course",
        path: "/partner/bookings/new",
        icon: "booking-new",
        permission: "ops.trips.view",
      },
      {
        label: "Courses récurrentes",
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
      {
        label: "Acomptes",
        path: "/partner/wallet/settlements",
        icon: "wallet",
        permission: "finance.wallets.view",
      },
      {
        label: "Revenus",
        path: "/partner/wallet/revenue",
        icon: "wallet",
        permission: "finance.wallets.view",
      },
      {
        label: "Grand livre",
        path: "/partner/wallet/ledger",
        icon: "wallet",
        permission: "finance.wallets.view",
      },
    ],
  },
  {
    group: "SUPPORT",
    items: [
      {
        label: "Chat support",
        path: "/partner/support/chat",
        icon: "chat",
        permission: "ops.dashboard.view",
      },
      {
        label: "Notifications",
        path: "/partner/support/notifications",
        icon: "notifications",
        permission: "ops.dashboard.view",
      },
      {
        label: "Messages course",
        path: "/partner/support/conversations",
        icon: "chat",
        permission: "ops.dashboard.view",
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
      {
        label: "Membres de l'équipe",
        path: "/partner/members",
        icon: "drivers",
        permission: "ops.dashboard.view",
      },
    ],
  },
];
