import type { NavGroup } from "@/portals/shared/navTypes";

/**
 * Navigation partenaire.
 * Le champ `module` filtre l'affichage selon le `partner_type` (VTC/FLEET,
 * FREIGHT, RENTAL, MIXED) via `useScope().hasModule` — appliqué dans
 * `PartnerShell`. Les entrées sans `module` sont communes à tous les partenaires.
 */
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
        module: "fleet",
      },
      {
        label: "Chauffeurs",
        path: "/partner/drivers",
        icon: "drivers",
        permission: "fleet.drivers.view",
        module: "fleet",
      },
      {
        label: "Courses",
        path: "/partner/orders",
        icon: "trips",
        permission: "ops.trips.view",
        module: "fleet",
      },
      {
        label: "Carte live",
        path: "/partner/map",
        icon: "map",
        permission: "ops.map.view",
        module: "fleet",
      },
      {
        label: "Performance",
        path: "/partner/performance",
        icon: "reports",
        permission: "fleet.drivers.view",
        module: "fleet",
      },
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
        module: "freight",
      },
      {
        label: "Zones & Couloirs",
        path: "/partner/freight/zones",
        icon: "map",
        permission: "partner.freight.view",
        module: "freight",
      },
    ],
  },
  {
    group: "LOCATION",
    items: [
      {
        label: "Réservations",
        path: "/partner/rental",
        icon: "bookings",
        permission: "partner.rental.view",
        module: "rental",
      },
      {
        label: "Flotte location",
        path: "/partner/rental/fleet",
        icon: "fleet",
        permission: "partner.rental.view",
        module: "rental",
      },
      {
        label: "Calendrier",
        path: "/partner/rental/calendar",
        icon: "shifts",
        permission: "partner.rental.view",
        module: "rental",
      },
      {
        label: "Tarifs & conditions",
        path: "/partner/rental/pricing",
        icon: "commissions",
        permission: "partner.rental.view",
        module: "rental",
      },
      {
        label: "Finance location",
        path: "/partner/rental/finance",
        icon: "finance",
        permission: "partner.rental.view",
        module: "rental",
      },
    ],
  },
  {
    group: "ACTIVITÉ",
    items: [
      {
        label: "Planification des heures de travail",
        path: "/partner/shifts",
        icon: "shifts",
        permission: "fleet.drivers.view",
        module: "fleet",
      },
      {
        label: "Rapports",
        path: "/partner/reports",
        icon: "reports",
        permission: "ops.trips.view",
        module: "fleet",
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
        module: "fleet",
      },
      // {
      //   label: "Acomptes",
      //   path: "/partner/wallet/settlements",
      //   icon: "wallet",
      //   permission: "finance.wallets.view",
      // },
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
        module: "fleet",
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
