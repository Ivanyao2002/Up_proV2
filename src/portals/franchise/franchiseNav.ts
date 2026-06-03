import type { NavGroup } from "@/portals/admin/adminNav";

export const FRANCHISE_NAV: NavGroup[] = [
  {
    group: "TERRITOIRE",
    items: [
      {
        label: "Tableau de bord",
        path: "/franchise/dashboard",
        permission: "ops.dashboard.view",
      },
      {
        label: "Carte territoire",
        path: "/franchise/territory",
        permission: "ops.dashboard.view",
      },
      {
        label: "Extension territoire",
        path: "/franchise/territory/extension",
        permission: "ops.dashboard.view",
      },
      {
        label: "Sous-partenaires",
        path: "/franchise/partners",
        permission: "network.partners.view",
      },
      {
        label: "Chauffeurs",
        path: "/franchise/drivers",
        permission: "fleet.drivers.view",
      },
      {
        label: "Modération KYC",
        path: "/franchise/drivers/moderation",
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
        permission: "finance.wallets.view",
      },
      {
        label: "Codes promo",
        path: "/franchise/promos",
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
        permission: "network.partners.view",
      },
    ],
  },
];
