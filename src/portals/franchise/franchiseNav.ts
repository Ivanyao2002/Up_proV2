import type { NavGroup } from "@/portals/shared/navTypes";

export const FRANCHISE_NAV: NavGroup[] = [
  {
    group: "TERRITOIRE",
    items: [
      {
        label: "Tableau de bord",
        path: "/franchise/dashboard",
        icon: "dashboard",
        permission: "ops.dashboard.view",
      },
      {
        label: "Carte live",
        path: "/franchise/map",
        icon: "map",
        permission: "ops.map.view",
      },
      {
        label: "Carte territoire",
        path: "/franchise/territory",
        icon: "territory",
        permission: "ops.dashboard.view",
      },
      {
        label: "Extension territoire",
        path: "/franchise/territory/extension",
        icon: "territory",
        permission: "ops.dashboard.view",
      },
      {
        label: "Sous-partenaires",
        path: "/franchise/partners",
        icon: "partners",
        permission: "network.partners.view",
      },
      {
        label: "Chauffeurs",
        path: "/franchise/drivers",
        icon: "drivers",
        permission: "fleet.drivers.view",
      },
      {
        label: "Modération KYC",
        path: "/franchise/drivers/moderation",
        icon: "drivers-pending",
        permission: "fleet.kyc.approve",
      },
    ],
  },
  {
    group: "FINANCE",
    items: [
      {
        label: "Finance locale",
        path: "/franchise/finance",
        icon: "finance",
        permission: "finance.wallets.view",
      },
      {
        label: "Recharges chauffeurs",
        path: "/franchise/finance/driver-transfers",
        icon: "wallet-transfer",
        permission: "finance.wallets.view",
      },
      {
        label: "Codes promo",
        path: "/franchise/promos",
        icon: "promo",
        permission: "ops.dashboard.view",
      },
    ],
  },
  {
    group: "SUPPORT",
    items: [
      {
        label: "Tickets partenaires",
        path: "/franchise/support",
        icon: "support",
        permission: "network.partners.view",
      },
    ],
  },
];
